import { runChoiceAutopilot } from "./choice-autopilot.js";

const API_BASE = "https://api.accesstrade.vn";
const CREDENTIAL_KEY = "choice:autopilot:credential:v1";
const AUTOPILOT_STATUS_KEY = "choice:autopilot:status:v1";
const CATALOG_KEY = "choice:catalog:v1";
const SNAPSHOT_KEY = "choice:revenue:snapshot:v1";
const SYNC_LOCK_KEY = "choice:revenue:sync-lock:v1";
const OWNER_TICKET_PREFIX = "choice:revenue:ticket:";
const OWNER_SESSION_PREFIX = "choice:revenue:session:";
const OWNER_COOKIE = "choice_revenue_session";
const OWNER_DASHBOARD_URL = "https://hiennhi89-gate.hiennhi89.workers.dev/owner/choice/revenue";
const SYNC_MIN_INTERVAL_MS = 55 * 1000;
const DISCOVERY_INTERVAL_MS = 6 * 60 * 60 * 1000;
const SESSION_TTL_SECONDS = 12 * 60 * 60;
const TICKET_TTL_SECONDS = 10 * 60;
const FETCH_TIMEOUT_MS = 15000;
const RANGE_DAYS = 30;

const enc = new TextEncoder();
const dec = new TextDecoder();

function clean(value, max = 500) {
  return String(value ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function num(value, fallback = 0) {
  const parsed = Number(String(value ?? "").replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function roundMoney(value) {
  return Math.round(Math.max(0, num(value)));
}

function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      "x-robots-tag": "noindex, nofollow, noarchive",
      "referrer-policy": "no-referrer",
      ...headers
    }
  });
}

function b64url(bytes) {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function unb64(value) {
  const raw = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(raw + "=".repeat((4 - raw.length % 4) % 4)), (char) => char.charCodeAt(0));
}

function randomToken(size = 32) {
  return b64url(crypto.getRandomValues(new Uint8Array(size)));
}

async function digest(value) {
  return b64url(new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(String(value)))));
}

async function deriveCredentialKey(env) {
  const secret = clean(env.SESSION_SECRET, 500);
  if (secret.length < 32) throw new Error("session_secret_missing");
  const raw = enc.encode(`${secret}:choice-autopilot-credential-v1`);
  const hash = await crypto.subtle.digest("SHA-256", raw);
  return crypto.subtle.importKey("raw", hash, { name: "AES-GCM" }, false, ["decrypt"]);
}

async function getAccessToken(env) {
  const direct = clean(env.ACCESSTRADE_API_TOKEN, 1200);
  if (direct) return { token: direct, source: "worker_secret" };
  const stored = await env.KV.get(CREDENTIAL_KEY);
  if (!stored) return { token: "", source: "none" };
  try {
    const parsed = JSON.parse(stored);
    if (parsed?.v !== 1) throw new Error("credential_version");
    const key = await deriveCredentialKey(env);
    const clear = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: unb64(parsed.iv) },
      key,
      unb64(parsed.data)
    );
    return { token: clean(dec.decode(clear), 1200), source: "encrypted_kv" };
  } catch (_) {
    return { token: "", source: "invalid_encrypted_kv" };
  }
}

async function fetchJson(url, token, options = {}, fetchImpl = fetch) {
  let lastError = null;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const response = await fetchImpl(url, {
        ...options,
        signal: controller.signal,
        headers: {
          accept: "application/json",
          authorization: `Token ${token}`,
          "content-type": "application/json",
          ...(options.headers || {})
        }
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(`accesstrade_http_${response.status}`);
      if (data?.status === false) throw new Error(clean(data.message, 180) || "accesstrade_rejected");
      return data;
    } catch (error) {
      lastError = error;
      if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 350));
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError || new Error("accesstrade_unavailable");
}

function vnDate(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${byType.year}-${byType.month}-${byType.day}`;
}

function dateDaysAgo(days) {
  return vnDate(new Date(Date.now() - days * 24 * 60 * 60 * 1000));
}

function isoDaysAgo(days) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

async function fetchOrders(token, fetchImpl = fetch) {
  const url = new URL(`${API_BASE}/v1/order-list`);
  url.searchParams.set("since", isoDaysAgo(RANGE_DAYS + 1));
  url.searchParams.set("until", new Date().toISOString());
  url.searchParams.set("limit", "300");
  url.searchParams.set("page", "1");
  url.searchParams.set("utm_source", "hoi-chon-dung");
  const first = await fetchJson(url.toString(), token, {}, fetchImpl);
  const rows = Array.isArray(first?.data) ? [...first.data] : [];
  if (rows.length === 300) {
    url.searchParams.set("page", "2");
    const second = await fetchJson(url.toString(), token, {}, fetchImpl);
    if (Array.isArray(second?.data)) rows.push(...second.data);
  }
  return rows.slice(0, 600);
}

async function fetchTransactions(token, fetchImpl = fetch) {
  const url = new URL(`${API_BASE}/v1/transactions`);
  url.searchParams.set("since", isoDaysAgo(RANGE_DAYS + 1));
  url.searchParams.set("until", new Date().toISOString());
  url.searchParams.set("limit", "300");
  url.searchParams.set("offset", "0");
  url.searchParams.set("utm_source", "hoi-chon-dung");
  const first = await fetchJson(url.toString(), token, {}, fetchImpl);
  const rows = Array.isArray(first?.data) ? [...first.data] : [];
  if (rows.length === 300) {
    url.searchParams.set("offset", "300");
    const second = await fetchJson(url.toString(), token, {}, fetchImpl);
    if (Array.isArray(second?.data)) rows.push(...second.data);
  }
  return rows.slice(0, 600);
}

function normalizeOrder(row) {
  const pending = Math.max(0, Math.round(num(row?.order_pending)));
  const approved = Math.max(0, Math.round(num(row?.order_approved)));
  const rejected = Math.max(0, Math.round(num(row?.order_reject)));
  let status = "pending";
  if (approved > 0 && pending === 0 && rejected === 0) status = "approved";
  else if (rejected > 0 && pending === 0 && approved === 0) status = "rejected";
  else if (approved > 0 || rejected > 0) status = "mixed";
  return {
    order_id: clean(row?.order_id, 120),
    merchant: clean(row?.merchant, 100),
    sales_time: clean(row?.sales_time || row?.transaction_time, 50),
    update_time: clean(row?.update_time, 50),
    billing: roundMoney(row?.billing || row?.transaction_value),
    commission: roundMoney(row?.pub_commission || row?.commission),
    products_count: Math.max(0, Math.round(num(row?.products_count, 1))),
    pending,
    approved,
    rejected,
    status,
    utm_source: clean(row?.utm_source, 80),
    utm_medium: clean(row?.utm_medium, 80),
    utm_campaign: clean(row?.utm_campaign, 120),
    utm_content: clean(row?.utm_content, 160)
  };
}

function normalizeTransaction(row) {
  const statusCode = Number(row?.status);
  return {
    transaction_id: clean(row?.transaction_id || row?.conversion_id, 140),
    order_id: clean(row?.transaction_id || row?.order_id, 140),
    merchant: clean(row?.merchant, 100),
    transaction_time: clean(row?.transaction_time || row?.sales_time, 50),
    update_time: clean(row?.update_time, 50),
    status: statusCode === 1 ? "approved" : statusCode === 2 ? "rejected" : "pending",
    value: roundMoney(row?.transaction_value || row?.billing),
    commission: roundMoney(row?.commission || row?.pub_commission),
    product_id: clean(row?.product_id, 160),
    product_name: clean(row?.product_name, 220),
    quantity: Math.max(1, Math.round(num(row?.product_quantity, 1))),
    utm_source: clean(row?.utm_source || row?._utm_source, 80),
    utm_medium: clean(row?.utm_medium || row?._utm_medium, 80),
    utm_campaign: clean(row?.utm_campaign || row?._utm_campaign, 120),
    utm_content: clean(row?.utm_content || row?._utm_content, 160)
  };
}

async function readCatalogMaps(env) {
  try {
    const parsed = JSON.parse(await env.KV.get(CATALOG_KEY) || "{}");
    const products = Array.isArray(parsed.products) ? parsed.products : [];
    const bySource = new Map();
    const byId = new Map();
    for (const product of products) {
      const info = {
        id: clean(product?.id, 100),
        name: clean(product?.name, 220),
        category: clean(product?.category, 40),
        source_id: clean(product?.source_product_id, 160)
      };
      if (info.id) byId.set(info.id, info);
      if (info.source_id) bySource.set(info.source_id, info);
    }
    return { bySource, byId, count: products.length };
  } catch (_) {
    return { bySource: new Map(), byId: new Map(), count: 0 };
  }
}

async function readClickRows(env) {
  const keys = [];
  let cursor;
  do {
    const page = await env.KV.list({ prefix: "choice:click-day:", cursor, limit: 1000 });
    keys.push(...(page.keys || []).map((item) => item.name));
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor && keys.length < 5000);

  const oldest = dateDaysAgo(RANGE_DAYS);
  const selected = keys.filter((key) => {
    const match = key.match(/^choice:click-day:(\d{4}-\d{2}-\d{2}):(.+)$/);
    return match && match[1] >= oldest;
  });
  const rows = [];
  for (let offset = 0; offset < selected.length; offset += 50) {
    const chunk = selected.slice(offset, offset + 50);
    const values = await Promise.all(chunk.map((key) => env.KV.get(key)));
    chunk.forEach((key, index) => {
      const match = key.match(/^choice:click-day:(\d{4}-\d{2}-\d{2}):(.+)$/);
      const count = Math.max(0, Math.round(num(values[index])));
      if (match && count) rows.push({ date: match[1], product_id: match[2], clicks: count });
    });
  }
  return rows;
}

function emptyDay(date) {
  return {
    date,
    clicks: 0,
    orders: 0,
    sales: 0,
    commission: 0,
    pending_commission: 0,
    approved_commission: 0,
    rejected_commission: 0
  };
}

function buildDateSeries() {
  const series = [];
  for (let days = RANGE_DAYS - 1; days >= 0; days -= 1) series.push(emptyDay(dateDaysAgo(days)));
  return series;
}

function aggregateRange(daily, days) {
  const start = dateDaysAgo(days - 1);
  const rows = daily.filter((item) => item.date >= start);
  const summary = rows.reduce((acc, row) => {
    for (const key of ["clicks", "orders", "sales", "commission", "pending_commission", "approved_commission", "rejected_commission"]) {
      acc[key] += num(row[key]);
    }
    return acc;
  }, { clicks: 0, orders: 0, sales: 0, commission: 0, pending_commission: 0, approved_commission: 0, rejected_commission: 0 });
  summary.conversion_rate = summary.clicks ? summary.orders / summary.clicks : 0;
  summary.epc = summary.clicks ? summary.commission / summary.clicks : 0;
  summary.approved_epc = summary.clicks ? summary.approved_commission / summary.clicks : 0;
  summary.average_order_value = summary.orders ? summary.sales / summary.orders : 0;
  return summary;
}

function aggregateByKey(rows, keyFn, valueFn) {
  const map = new Map();
  for (const row of rows) {
    const key = clean(keyFn(row), 180) || "Không xác định";
    const current = map.get(key) || { key, orders: 0, sales: 0, commission: 0, approved_commission: 0, rejected: 0 };
    const value = valueFn(row);
    current.orders += value.orders || 0;
    current.sales += value.sales || 0;
    current.commission += value.commission || 0;
    current.approved_commission += value.approved_commission || 0;
    current.rejected += value.rejected || 0;
    map.set(key, current);
  }
  return [...map.values()].sort((a, b) => b.commission - a.commission || b.orders - a.orders);
}

function buildAlerts(ranges, previous7, transactions) {
  const alerts = [];
  if (ranges.today.clicks >= 20 && ranges.today.orders === 0) {
    alerts.push({ level: "warning", code: "clicks_without_orders", text: "Hôm nay có nhiều lượt chuyển sang nơi bán nhưng chưa ghi nhận đơn hàng." });
  }
  const rejected = transactions.filter((item) => item.status === "rejected").length;
  if (transactions.length >= 5 && rejected / transactions.length >= 0.3) {
    alerts.push({ level: "warning", code: "high_rejection", text: "Tỷ lệ giao dịch bị từ chối trong 30 ngày đang cao hơn 30%." });
  }
  if (previous7.approved_commission > 0 && ranges.d7.approved_commission < previous7.approved_commission * 0.6) {
    alerts.push({ level: "warning", code: "commission_drop", text: "Hoa hồng đã duyệt 7 ngày gần nhất giảm đáng kể so với 7 ngày trước đó." });
  }
  if (!alerts.length) alerts.push({ level: "ok", code: "normal", text: "Chưa phát hiện bất thường đáng kể trong dữ liệu hiện có." });
  return alerts;
}

function buildSnapshot(orders, transactions, clickRows, catalogMaps, credentialSource) {
  const daily = buildDateSeries();
  const dailyMap = new Map(daily.map((item) => [item.date, item]));
  const uniqueOrdersByDate = new Map();

  for (const click of clickRows) {
    const day = dailyMap.get(click.date);
    if (day) day.clicks += click.clicks;
  }
  for (const order of orders) {
    const date = vnDate(order.sales_time);
    const day = dailyMap.get(date);
    if (!day || !order.order_id) continue;
    const dedupe = `${date}:${order.order_id}`;
    if (uniqueOrdersByDate.has(dedupe)) continue;
    uniqueOrdersByDate.set(dedupe, true);
    day.orders += 1;
    day.sales += order.billing;
  }
  for (const transaction of transactions) {
    const date = vnDate(transaction.transaction_time);
    const day = dailyMap.get(date);
    if (!day) continue;
    day.commission += transaction.commission;
    if (transaction.status === "approved") day.approved_commission += transaction.commission;
    else if (transaction.status === "rejected") day.rejected_commission += transaction.commission;
    else day.pending_commission += transaction.commission;
  }

  const ranges = {
    today: aggregateRange(daily, 1),
    d7: aggregateRange(daily, 7),
    d30: aggregateRange(daily, 30)
  };
  const previous7Rows = daily.filter((item) => item.date >= dateDaysAgo(13) && item.date <= dateDaysAgo(7));
  const previous7 = aggregateRange(previous7Rows, 7);

  const clicksByProduct = new Map();
  for (const click of clickRows) clicksByProduct.set(click.product_id, (clicksByProduct.get(click.product_id) || 0) + click.clicks);
  const productRows = aggregateByKey(transactions, (item) => {
    const mapped = catalogMaps.bySource.get(item.utm_content) || catalogMaps.bySource.get(item.product_id);
    return mapped?.name || item.product_name || item.utm_content || item.product_id || "Sản phẩm chưa xác định";
  }, (item) => ({
    orders: 1,
    sales: item.value,
    commission: item.commission,
    approved_commission: item.status === "approved" ? item.commission : 0,
    rejected: item.status === "rejected" ? 1 : 0
  })).slice(0, 20);
  for (const product of productRows) {
    const catalog = [...catalogMaps.byId.values()].find((item) => item.name === product.key);
    product.clicks = catalog ? clicksByProduct.get(catalog.id) || 0 : 0;
    product.epc = product.clicks ? product.commission / product.clicks : 0;
  }

  const campaigns = aggregateByKey(orders, (item) => item.utm_campaign || item.utm_medium || item.utm_source, (item) => ({
    orders: 1,
    sales: item.billing,
    commission: item.commission,
    approved_commission: item.status === "approved" ? item.commission : 0,
    rejected: item.status === "rejected" ? 1 : 0
  })).slice(0, 20);

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.sales_time || 0) - new Date(a.sales_time || 0))
    .slice(0, 100);

  return {
    version: 1,
    connected: true,
    credential_source: credentialSource,
    updated_at: new Date().toISOString(),
    data_window_days: RANGE_DAYS,
    catalog_products: catalogMaps.count,
    ranges,
    daily,
    top_products: productRows,
    top_campaigns: campaigns,
    recent_orders: recentOrders,
    alerts: buildAlerts(ranges, previous7, transactions),
    totals: {
      transactions: transactions.length,
      orders: new Set(orders.map((item) => item.order_id).filter(Boolean)).size,
      clicks: clickRows.reduce((sum, item) => sum + item.clicks, 0)
    }
  };
}

async function readSnapshot(env) {
  try {
    const raw = await env.KV.get(SNAPSHOT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

async function writeSnapshot(env, snapshot) {
  await env.KV.put(SNAPSHOT_KEY, JSON.stringify(snapshot));
  return snapshot;
}

export async function syncChoiceRevenue(env, options = {}) {
  const force = options.force === true;
  const fetchImpl = options.fetchImpl || fetch;
  const previous = await readSnapshot(env);
  const previousAt = new Date(previous?.updated_at || 0).getTime();
  if (!force && previousAt && Date.now() - previousAt < SYNC_MIN_INTERVAL_MS) return previous;
  if (await env.KV.get(SYNC_LOCK_KEY)) return previous || { connected: false, syncing: true, updated_at: "" };
  await env.KV.put(SYNC_LOCK_KEY, String(Date.now()), { expirationTtl: 120 });
  try {
    const credential = await getAccessToken(env);
    if (!credential.token) {
      return writeSnapshot(env, {
        ...(previous || {}),
        version: 1,
        connected: false,
        credential_source: credential.source,
        updated_at: new Date().toISOString(),
        ranges: previous?.ranges || { today: aggregateRange([], 1), d7: aggregateRange([], 7), d30: aggregateRange([], 30) },
        daily: previous?.daily || buildDateSeries(),
        top_products: previous?.top_products || [],
        top_campaigns: previous?.top_campaigns || [],
        recent_orders: previous?.recent_orders || [],
        alerts: [{ level: "action", code: "connect_affiliate", text: "Cần kết nối tài khoản affiliate một lần để đồng bộ đơn hàng và hoa hồng." }]
      });
    }
    const [rawOrders, rawTransactions, clickRows, catalogMaps] = await Promise.all([
      fetchOrders(credential.token, fetchImpl),
      fetchTransactions(credential.token, fetchImpl),
      readClickRows(env),
      readCatalogMaps(env)
    ]);
    const orders = rawOrders.map(normalizeOrder).filter((item) => item.order_id && item.sales_time);
    const transactions = rawTransactions.map(normalizeTransaction).filter((item) => item.transaction_time);
    return writeSnapshot(env, buildSnapshot(orders, transactions, clickRows, catalogMaps, credential.source));
  } catch (error) {
    const snapshot = {
      ...(previous || {}),
      version: 1,
      connected: !!(await getAccessToken(env)).token,
      updated_at: previous?.updated_at || "",
      last_sync_attempt_at: new Date().toISOString(),
      last_error: clean(error?.message, 240) || "revenue_sync_failed",
      alerts: [
        { level: "warning", code: "sync_error", text: "Dữ liệu mới chưa đồng bộ được; dashboard đang giữ số liệu gần nhất." },
        ...(previous?.alerts || []).filter((item) => item.code !== "sync_error")
      ].slice(0, 8)
    };
    await writeSnapshot(env, snapshot);
    return snapshot;
  } finally {
    await env.KV.delete?.(SYNC_LOCK_KEY);
  }
}

async function readAutopilotStatus(env) {
  try {
    return JSON.parse(await env.KV.get(AUTOPILOT_STATUS_KEY) || "{}");
  } catch (_) {
    return {};
  }
}

export async function runChoiceGrowthCycle(env, options = {}) {
  const status = await readAutopilotStatus(env);
  const lastDiscovery = new Date(status?.last_run_at || 0).getTime();
  const discoveryDue = options.forceDiscovery === true || !lastDiscovery || Date.now() - lastDiscovery >= DISCOVERY_INTERVAL_MS;
  let discovery = null;
  if (discoveryDue) {
    discovery = await runChoiceAutopilot(env, {
      trigger: clean(options.trigger, 40) || "growth_cycle",
      fetchImpl: options.fetchImpl || fetch
    });
  }
  const revenue = await syncChoiceRevenue(env, { force: options.forceRevenue === true, fetchImpl: options.fetchImpl || fetch });
  return { ok: discovery ? discovery.ok !== false : true, discovery_due: discoveryDue, discovery, revenue_updated_at: revenue?.updated_at || "", connected: !!revenue?.connected };
}

function parseCookies(request) {
  const result = {};
  for (const part of String(request.headers.get("cookie") || "").split(";")) {
    const index = part.indexOf("=");
    if (index < 0) continue;
    result[part.slice(0, index).trim()] = decodeURIComponent(part.slice(index + 1).trim());
  }
  return result;
}

async function createOwnerTicket(env) {
  const token = randomToken(32);
  const key = `${OWNER_TICKET_PREFIX}${await digest(token)}`;
  await env.KV.put(key, JSON.stringify({ created_at: new Date().toISOString() }), { expirationTtl: TICKET_TTL_SECONDS });
  return `${OWNER_DASHBOARD_URL}?ticket=${encodeURIComponent(token)}`;
}

async function exchangeOwnerTicket(env, token) {
  const ticketKey = `${OWNER_TICKET_PREFIX}${await digest(token)}`;
  const exists = await env.KV.get(ticketKey);
  if (!exists) return null;
  await env.KV.delete?.(ticketKey);
  const session = randomToken(32);
  await env.KV.put(`${OWNER_SESSION_PREFIX}${await digest(session)}`, JSON.stringify({ created_at: new Date().toISOString() }), { expirationTtl: SESSION_TTL_SECONDS });
  return session;
}

async function ownerSessionValid(request, env) {
  const token = parseCookies(request)[OWNER_COOKIE];
  if (!token) return false;
  return !!await env.KV.get(`${OWNER_SESSION_PREFIX}${await digest(token)}`);
}

async function revokeOwnerSession(request, env) {
  const token = parseCookies(request)[OWNER_COOKIE];
  if (token) await env.KV.delete?.(`${OWNER_SESSION_PREFIX}${await digest(token)}`);
}

function privateHeaders(extra = {}) {
  return {
    "content-type": "text/html; charset=utf-8",
    "cache-control": "no-store, private",
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    "x-robots-tag": "noindex, nofollow, noarchive",
    "referrer-policy": "no-referrer",
    "permissions-policy": "camera=(), microphone=(), geolocation=(), payment=()",
    "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; img-src 'self' data: https:; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
    ...extra
  };
}

function dashboardHtml() {
  return `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="robots" content="noindex,nofollow,noarchive"><title>Trung tâm doanh thu Hội Chọn Đúng</title><style>
:root{--bg:#071d19;--panel:#0d2b25;--panel2:#123931;--text:#f6f2e8;--muted:#9fb9b1;--line:#285048;--accent:#dcec6d;--warn:#ffc66d;--bad:#ff8978;--ok:#7ed7ac}*{box-sizing:border-box}body{margin:0;background:linear-gradient(145deg,#061713,#0a2620 70%);color:var(--text);font-family:Inter,ui-sans-serif,system-ui,-apple-system,sans-serif;min-height:100vh}button,select{font:inherit}.shell{width:min(1180px,calc(100% - 28px));margin:auto}.top{position:sticky;top:0;z-index:10;background:rgba(7,29,25,.9);backdrop-filter:blur(16px);border-bottom:1px solid var(--line)}.topin{min-height:68px;display:flex;align-items:center;justify-content:space-between;gap:14px}.brand{font-weight:900;letter-spacing:.05em}.brand small{display:block;color:var(--muted);font-weight:500;letter-spacing:0;margin-top:2px}.actions{display:flex;gap:8px}.btn{border:1px solid var(--line);border-radius:999px;background:transparent;color:var(--text);padding:10px 14px;cursor:pointer;font-weight:750}.btn.primary{background:var(--accent);color:#15372e;border-color:var(--accent)}main{padding:28px 0 70px}.head{display:flex;justify-content:space-between;gap:20px;align-items:end;margin-bottom:20px}.head h1{margin:0;font-family:Georgia,serif;font-size:clamp(2rem,5vw,4rem);font-weight:500}.head p{margin:7px 0 0;color:var(--muted)}.ranges{display:flex;gap:7px}.ranges button{border:1px solid var(--line);background:transparent;color:var(--muted);padding:8px 12px;border-radius:999px;cursor:pointer}.ranges button.active{background:var(--accent);border-color:var(--accent);color:#15372e;font-weight:850}.notice{display:none;border:1px solid var(--warn);background:rgba(255,198,109,.1);border-radius:16px;padding:14px;margin-bottom:18px}.notice.show{display:block}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.card{border:1px solid var(--line);border-radius:18px;background:linear-gradient(145deg,var(--panel),var(--panel2));padding:18px}.card span{display:block;color:var(--muted);font-size:.78rem}.card strong{display:block;font-size:clamp(1.35rem,3vw,2rem);margin-top:6px}.card small{color:var(--muted)}.wide{grid-column:span 2}.section{margin-top:22px}.section h2{font-family:Georgia,serif;font-weight:500;margin:0 0 12px}.chart{height:230px;display:flex;align-items:end;gap:3px;border-bottom:1px solid var(--line);padding-top:20px}.bar{flex:1;min-width:4px;background:linear-gradient(var(--accent),#6cab91);border-radius:5px 5px 0 0;position:relative}.bar:hover:after{content:attr(data-tip);position:absolute;bottom:100%;left:50%;transform:translateX(-50%);background:#fff;color:#132d27;padding:5px 7px;border-radius:6px;white-space:nowrap;font-size:.68rem;z-index:3}.tablewrap{overflow:auto;border:1px solid var(--line);border-radius:18px;background:var(--panel)}table{width:100%;border-collapse:collapse;min-width:760px}th,td{text-align:left;padding:12px;border-bottom:1px solid var(--line);font-size:.82rem}th{color:var(--muted);font-weight:700}td strong{color:var(--text)}.status{display:inline-block;border-radius:999px;padding:4px 8px;font-size:.7rem;font-weight:800}.pending{background:rgba(255,198,109,.18);color:var(--warn)}.approved{background:rgba(126,215,172,.18);color:var(--ok)}.rejected{background:rgba(255,137,120,.18);color:var(--bad)}.mixed{background:rgba(159,185,177,.18);color:var(--muted)}.alerts{display:grid;gap:8px}.alert{border-left:4px solid var(--ok);background:var(--panel);border-radius:10px;padding:12px}.alert.warning,.alert.action{border-left-color:var(--warn)}.foot{color:var(--muted);font-size:.75rem;margin-top:18px}@media(max-width:820px){.grid{grid-template-columns:1fr 1fr}.wide{grid-column:span 2}.head{align-items:start;flex-direction:column}.topin{align-items:flex-start;padding:12px 0}.actions{flex-wrap:wrap;justify-content:flex-end}}@media(max-width:480px){.grid{grid-template-columns:1fr}.wide{grid-column:span 1}.actions .btn{padding:8px 10px}.brand small{display:none}}
</style></head><body><header class="top"><div class="shell topin"><div class="brand">HỘI CHỌN ĐÚNG<small>Trung tâm doanh thu riêng</small></div><div class="actions"><button id="refresh" class="btn primary">Đồng bộ ngay</button><button id="logout" class="btn">Đăng xuất</button></div></div></header><main class="shell"><div class="head"><div><h1>Doanh thu & hiệu quả</h1><p id="freshness">Đang tải dữ liệu…</p></div><div class="ranges"><button data-range="today">Hôm nay</button><button data-range="d7" class="active">7 ngày</button><button data-range="d30">30 ngày</button></div></div><div id="notice" class="notice"></div><section class="grid"><div class="card"><span>Doanh số ghi nhận</span><strong id="sales">—</strong><small id="orders">—</small></div><div class="card"><span>Hoa hồng ghi nhận</span><strong id="commission">—</strong><small id="commissionBreakdown">—</small></div><div class="card"><span>Tỷ lệ đơn / click</span><strong id="conversion">—</strong><small id="clicks">—</small></div><div class="card"><span>Hoa hồng mỗi click</span><strong id="epc">—</strong><small id="approvedEpc">—</small></div><div class="card wide"><span>Biểu đồ hoa hồng 30 ngày</span><div id="chart" class="chart"></div></div><div class="card wide"><span>Cảnh báo và cơ hội</span><div id="alerts" class="alerts"></div></div></section><section class="section"><h2>Sản phẩm tạo doanh thu</h2><div class="tablewrap"><table><thead><tr><th>Sản phẩm</th><th>Đơn</th><th>Doanh số</th><th>Hoa hồng</th><th>Click</th><th>EPC</th></tr></thead><tbody id="products"></tbody></table></div></section><section class="section"><h2>Đơn hàng gần nhất</h2><div class="tablewrap"><table><thead><tr><th>Thời gian</th><th>Mã đơn</th><th>Nơi bán</th><th>Trạng thái</th><th>Giá trị</th><th>Hoa hồng</th></tr></thead><tbody id="recent"></tbody></table></div></section><p class="foot">Dữ liệu được đồng bộ từ mạng affiliate và có thể chậm vài phút do thời gian ghi nhận/đối soát của nguồn.</p></main><script>
const money=new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND',maximumFractionDigits:0});const pct=new Intl.NumberFormat('vi-VN',{style:'percent',maximumFractionDigits:2});let data=null;let range='d7';const $=id=>document.getElementById(id);const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));function statusText(s){return({pending:'Chờ duyệt',approved:'Đã duyệt',rejected:'Từ chối',mixed:'Hỗn hợp'})[s]||s}function render(){if(!data)return;const r=data.ranges?.[range]||{};$('sales').textContent=money.format(r.sales||0);$('orders').textContent=(r.orders||0).toLocaleString('vi-VN')+' đơn · '+(r.clicks||0).toLocaleString('vi-VN')+' click';$('commission').textContent=money.format(r.commission||0);$('commissionBreakdown').textContent='Duyệt '+money.format(r.approved_commission||0)+' · Chờ '+money.format(r.pending_commission||0);$('conversion').textContent=pct.format(r.conversion_rate||0);$('clicks').textContent=(r.clicks||0).toLocaleString('vi-VN')+' lượt chuyển sang nơi bán';$('epc').textContent=money.format(r.epc||0);$('approvedEpc').textContent='EPC đã duyệt '+money.format(r.approved_epc||0);$('freshness').textContent=data.updated_at?'Cập nhật '+new Date(data.updated_at).toLocaleString('vi-VN'):'Chưa có lần đồng bộ';const notice=$('notice');if(!data.connected){notice.className='notice show';notice.textContent='Chưa kết nối tài khoản affiliate. Mở Telegram và dùng /autopilot để hoàn tất kết nối một lần.'}else{notice.className='notice';notice.textContent=''}const daily=data.daily||[];const max=Math.max(1,...daily.map(x=>x.commission||0));$('chart').innerHTML=daily.map(x=>'<div class="bar" style="height:'+Math.max(2,Math.round((x.commission||0)/max*100))+'%" data-tip="'+esc(x.date+' · '+money.format(x.commission||0))+'"></div>').join('');$('alerts').innerHTML=(data.alerts||[]).map(a=>'<div class="alert '+esc(a.level)+'">'+esc(a.text)+'</div>').join('');$('products').innerHTML=(data.top_products||[]).map(p=>'<tr><td><strong>'+esc(p.key)+'</strong></td><td>'+Number(p.orders||0).toLocaleString('vi-VN')+'</td><td>'+money.format(p.sales||0)+'</td><td>'+money.format(p.commission||0)+'</td><td>'+Number(p.clicks||0).toLocaleString('vi-VN')+'</td><td>'+money.format(p.epc||0)+'</td></tr>').join('')||'<tr><td colspan="6">Chưa có dữ liệu sản phẩm.</td></tr>';$('recent').innerHTML=(data.recent_orders||[]).map(o=>'<tr><td>'+esc(o.sales_time?new Date(o.sales_time).toLocaleString('vi-VN'):'—')+'</td><td>'+esc(o.order_id)+'</td><td>'+esc(o.merchant)+'</td><td><span class="status '+esc(o.status)+'">'+esc(statusText(o.status))+'</span></td><td>'+money.format(o.billing||0)+'</td><td>'+money.format(o.commission||0)+'</td></tr>').join('')||'<tr><td colspan="6">Chưa có đơn hàng.</td></tr>'}async function load(force=false){$('refresh').disabled=true;try{const res=await fetch(force?'./api/refresh':'./api/summary',{method:force?'POST':'GET',credentials:'same-origin'});if(res.status===401){location.reload();return}data=await res.json();render()}finally{$('refresh').disabled=false}}document.querySelectorAll('[data-range]').forEach(b=>b.onclick=()=>{range=b.dataset.range;document.querySelectorAll('[data-range]').forEach(x=>x.classList.toggle('active',x===b));render()});$('refresh').onclick=()=>load(true);$('logout').onclick=async()=>{await fetch('./logout',{method:'POST',credentials:'same-origin'});location.reload()};load();setInterval(()=>load(false),60000);
</script></body></html>`;
}

function privateLoginHtml() {
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Truy cập riêng</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#071d19;color:#f6f2e8;font-family:system-ui}.box{width:min(440px,calc(100% - 32px));border:1px solid #285048;border-radius:20px;background:#0d2b25;padding:28px}.box h1{font-family:Georgia,serif;font-weight:500}.box p{color:#abc0ba;line-height:1.6}</style></head><body><div class="box"><h1>Đường dẫn riêng đã hết hạn</h1><p>Mở Telegram của công ty và gửi lệnh <strong>/doanhthu</strong> để nhận đường dẫn mới.</p></div></body></html>`;
}

export async function handleChoiceRevenueRequest(request, env) {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/owner/choice/revenue")) return null;

  if (url.pathname === "/owner/choice/revenue" && request.method === "GET" && url.searchParams.get("ticket")) {
    const session = await exchangeOwnerTicket(env, clean(url.searchParams.get("ticket"), 300));
    if (!session) return new Response(privateLoginHtml(), { status: 401, headers: privateHeaders() });
    return new Response(null, {
      status: 303,
      headers: privateHeaders({
        location: "/owner/choice/revenue",
        "set-cookie": `${OWNER_COOKIE}=${encodeURIComponent(session)}; Path=/owner/choice/revenue; Max-Age=${SESSION_TTL_SECONDS}; HttpOnly; Secure; SameSite=Strict`
      })
    });
  }

  const authenticated = await ownerSessionValid(request, env);
  if (!authenticated) return new Response(privateLoginHtml(), { status: 401, headers: privateHeaders() });

  if (url.pathname === "/owner/choice/revenue" && request.method === "GET") {
    return new Response(dashboardHtml(), { status: 200, headers: privateHeaders() });
  }
  if (url.pathname === "/owner/choice/revenue/api/summary" && request.method === "GET") {
    const snapshot = await syncChoiceRevenue(env);
    return json(snapshot || { connected: false, ranges: {}, daily: [] });
  }
  if (url.pathname === "/owner/choice/revenue/api/refresh" && request.method === "POST") {
    const snapshot = await syncChoiceRevenue(env, { force: true });
    return json(snapshot || { connected: false, ranges: {}, daily: [] });
  }
  if (url.pathname === "/owner/choice/revenue/logout" && request.method === "POST") {
    await revokeOwnerSession(request, env);
    return new Response(null, {
      status: 204,
      headers: privateHeaders({
        "set-cookie": `${OWNER_COOKIE}=; Path=/owner/choice/revenue; Max-Age=0; HttpOnly; Secure; SameSite=Strict`
      })
    });
  }
  return json({ error: "not_found" }, 404);
}

function send(chatId, text) {
  return { method: "sendMessage", body: { chat_id: chatId, text, disable_web_page_preview: true } };
}

function isOwner(update, env) {
  const message = update?.message;
  const owner = String(env.TELEGRAM_CHAT_ID || "");
  return !!owner && String(message?.chat?.id || "") === owner && String(message?.from?.id || "") === owner;
}

function telegramSummary(snapshot, range = "d7") {
  const item = snapshot?.ranges?.[range] || {};
  const label = range === "today" ? "HÔM NAY" : range === "d30" ? "30 NGÀY" : "7 NGÀY";
  return [
    `DOANH THU HỘI CHỌN ĐÚNG — ${label}`,
    `Đơn hàng: ${Number(item.orders || 0).toLocaleString("vi-VN")}`,
    `Doanh số ghi nhận: ${roundMoney(item.sales).toLocaleString("vi-VN")}đ`,
    `Hoa hồng ghi nhận: ${roundMoney(item.commission).toLocaleString("vi-VN")}đ`,
    `Đã duyệt: ${roundMoney(item.approved_commission).toLocaleString("vi-VN")}đ`,
    `Đang chờ: ${roundMoney(item.pending_commission).toLocaleString("vi-VN")}đ`,
    `Click: ${Number(item.clicks || 0).toLocaleString("vi-VN")}`,
    `Tỷ lệ đơn/click: ${(num(item.conversion_rate) * 100).toFixed(2)}%`,
    `EPC: ${roundMoney(item.epc).toLocaleString("vi-VN")}đ/click`,
    `Cập nhật: ${snapshot?.updated_at || "chưa có"}`
  ].join("\n");
}

export async function handleChoiceRevenueTelegram(update, env) {
  if (!isOwner(update, env)) return null;
  const message = update.message;
  const text = String(message.text || "").trim();
  const command = text.split(/\s+/, 1)[0].toLowerCase().split("@")[0];
  const chatId = message.chat.id;

  if (command === "/doanhthu") {
    const snapshot = await syncChoiceRevenue(env);
    const link = await createOwnerTicket(env);
    return { handled: true, calls: [send(chatId, `${telegramSummary(snapshot, "d7")}\n\nMở dashboard riêng (hết hạn sau 10 phút):\n${link}`)] };
  }
  if (["/doanhthu-ngay", "/doanhthu7", "/doanhthu30"].includes(command)) {
    const snapshot = await syncChoiceRevenue(env);
    const range = command === "/doanhthu-ngay" ? "today" : command === "/doanhthu30" ? "d30" : "d7";
    return { handled: true, calls: [send(chatId, telegramSummary(snapshot, range))] };
  }
  if (command === "/dongbo-doanhthu") {
    const snapshot = await syncChoiceRevenue(env, { force: true });
    return { handled: true, calls: [send(chatId, `Đã đồng bộ.\n\n${telegramSummary(snapshot, "d7")}`)] };
  }
  return null;
}

export const __test = {
  SNAPSHOT_KEY,
  vnDate,
  normalizeOrder,
  normalizeTransaction,
  buildSnapshot,
  aggregateRange,
  getAccessToken,
  createOwnerTicket,
  exchangeOwnerTicket,
  ownerSessionValid,
  telegramSummary
};
