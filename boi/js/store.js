// Kho dữ liệu dùng chung cho các màn: phiên câu hỏi, cài đặt (chỉ localStorage máy người dùng).
// AI mặc định = cầu nối máy nhà (Claude haiku-5-5, D22 30/10); cầu nối chưa nối được thì dùng trạm Gemini dự phòng.
import { loadSessions, saveSessions, createSession } from "./state.js";
import { LOCAL_KEY, LOCAL_BASE, TRAM_KEY, via, datCauNoi } from "./ai.js";

const SETTINGS_KEY = "boi.v1.settings";
const AIKEY_KEY = "boi.v1.aikey";
export const storage = (() => { try { const s = globalThis.localStorage; s.getItem("x"); return s; } catch (_) { return null; } })();

export const store = {
  db: null,
  sessions: loadSessions(storage),
  settings: (() => { try { return { xungHo: "Queen Linh", aiProvider: "gemini", ...(JSON.parse(storage?.getItem(SETTINGS_KEY) || "{}")) }; } catch (_) { return { xungHo: "Queen Linh", aiProvider: "gemini" }; } })(),
};

export function persist() {
  return saveSessions(store.sessions, storage);
}
export function saveSettings(next) {
  store.settings = { ...store.settings, ...next };
  try { storage?.setItem(SETTINGS_KEY, JSON.stringify(store.settings)); return true; } catch (_) { return false; }
}
// Mặc định đi cầu nối Claude (127.0.0.1 ở máy nhà, Worker cố định ở máy khác); trạm Gemini chỉ là dự phòng trong chuỗi gọi.
// Máy đã tắt cầu nối bằng ?cau-noi=0 thì đi trạm trước (trạm lỗi vẫn được cứu sang cầu nối).
export function aiKey() {
  return cauNoiAn() ? LOCAL_KEY : TRAM_KEY;
}
// Khoá cũ từng dán ở bản trước không còn dùng → xoá khỏi máy (không còn nút xoá trong Cài đặt)
try { for (const p of ["gemini", "openai", "anthropic"]) storage?.removeItem(`${AIKEY_KEY}.${p}`); } catch (_) { /* bỏ qua */ }
// Cầu nối Claude BẬT mặc định (30/10); tắt riêng máy này bằng link ?cau-noi=0, bật lại ?cau-noi=1
const CAU_NOI_KEY = "boi.v1.cau-noi";
export const cauNoiAn = () => { try { return storage?.getItem(CAU_NOI_KEY) !== "0"; } catch (_) { return true; } };
export function setCauNoiAn(on) { try { storage?.setItem(CAU_NOI_KEY, on ? "1" : "0"); return true; } catch (_) { return false; } }
// Địa chỉ cầu nối cố định (Cloudflare Worker, D22: Claude haiku 5-5): dùng thẳng, không chờ đọc cau_noi.json.
export const WORKER_BASE = "https://boi-cau-noi.hiennhi89.workers.dev/claude";
via.base = WORKER_BASE;
// local: null = chưa dò, true = đang ở máy nhà (127.0.0.1 trả lời), false = máy khác
export const bridge = { ok: true, xa: true, local: null, daDo: null };
const GHEP_KEY = "boi.v1.ghep";
const CAU_NOI_JSON = "https://api.github.com/repos/baominhle77-glitch/baominhle77-glitch.github.io/contents/boi/cau_noi.json?ref=main";
export const ghepToken = () => { try { return storage?.getItem(GHEP_KEY) || ""; } catch (_) { return ""; } };
export function setGhep(t) { try { if (t) { storage?.setItem(GHEP_KEY, t); setCauNoiAn(true); } else storage?.removeItem(GHEP_KEY); return true; } catch (_) { return false; } }
via.token = ghepToken();
async function ping(fetchImpl, base, token, ms) {
  const c = new AbortController(); const t = setTimeout(() => c.abort(), ms);
  try { const r = await fetchImpl(`${base}/ping`, { signal: c.signal, headers: token ? { "x-boi-token": token } : {} }); return r.ok; } finally { clearTimeout(t); }
}
// Địa chỉ trong boi/cau_noi.json (chỉ dùng làm dự phòng khi Worker lỗi): ưu tiên API GitHub, lỗi thì bản Pages kèm ?t=.
const CAU_NOI_PAGES = new URL("../cau_noi.json", import.meta.url).href;
const laDiaChi = (u) => /^https:\/\/[\w.-]+$/.test(u);
export async function docDiaChiCauNoi(fetchImpl = globalThis.fetch, ms = 5000) {
  const lay = async (u, headers) => {
    const c = new AbortController(); const t = setTimeout(() => c.abort(), ms);
    try { const r = await fetchImpl(u, { headers, cache: "no-store", signal: c.signal }); return r.ok ? String((await r.json()).url || "") : ""; }
    catch (_) { return ""; } finally { clearTimeout(t); }
  };
  const api = await lay(CAU_NOI_JSON, { accept: "application/vnd.github.raw" });
  if (laDiaChi(api)) return api;
  const pages = await lay(`${CAU_NOI_PAGES}?t=${Date.now()}`, {});
  return laDiaChi(pages) ? pages : "";
}
// Dò máy nhà: chỉ ping 127.0.0.1 (tối đa localMs). Có → đi 127.0.0.1 trước Worker; không → đi thẳng Worker. Không bao giờ chờ GitHub.
export function probeBridge(fetchImpl = globalThis.fetch, { on = cauNoiAn(), localMs = 1200 } = {}) {
  const run = (async () => {
    if (!on) { bridge.ok = false; bridge.xa = false; return false; }
    let local = false;
    try { local = await ping(fetchImpl, LOCAL_BASE, "", localMs); } catch (_) { local = false; }
    bridge.local = local;
    bridge.ok = true;
    bridge.xa = !local;
    if (local) via.base = LOCAL_BASE;
    else if (via.base === LOCAL_BASE) via.base = WORKER_BASE;
    return true;
  })();
  bridge.daDo = run;
  return run;
}
// Thứ tự địa chỉ cho chuỗi gọi AI: địa chỉ vừa chạy tốt → 127.0.0.1 (nếu là máy nhà) → Worker cố định
export const diaChiCauNoi = () => [...new Set([via.base, bridge.local ? LOCAL_BASE : null, WORKER_BASE].filter(Boolean))].filter((b) => b !== LOCAL_BASE || bridge.local);
datCauNoi({
  ds: diaChiCauNoi,
  duPhong: async (fetchImpl) => { const u = await docDiaChiCauNoi(fetchImpl, 4000); return u && `${u}/claude` !== WORKER_BASE ? [`${u}/claude`] : []; },
});
export const aiReady = () => !!aiKey();

export const getSession = (id) => store.sessions.find((s) => s.id === id) || null;

export function newDraft(cauHoi, suggestion, tenKhach = "") {
  const now = new Date();
  const d = { v: 1, draft: true, id: "q" + now.getTime().toString(36) + Math.random().toString(36).slice(2, 6), cauHoi: cauHoi.trim(), tenKhach: String(tenKhach || "").trim().slice(0, 40), suggestion, createdAt: now.toISOString(), lockedAt: now.toISOString(), rounds: [] };
  store.sessions.push(d);
  persist();
  return d;
}

// Khoá nháp: sinh seed + xáo + mã khoá; giữ nguyên id để link cũ vẫn mở đúng câu hỏi
export async function lockDraft(draft, cfg) {
  const s = await createSession({ cauHoi: draft.cauHoi, tenKhach: draft.tenKhach || "", ...cfg });
  s.id = draft.id;
  s.createdAt = draft.createdAt;
  const i = store.sessions.findIndex((x) => x.id === draft.id);
  if (i >= 0) store.sessions[i] = s; else store.sessions.push(s);
  persist();
  return s;
}

export function removeSession(id) {
  store.sessions = store.sessions.filter((s) => s.id !== id);
  persist();
}

// Bước phù hợp để mở một phiên
export function routeFor(s) {
  if (s.draft) return `#/trai/${s.id}`;
  if (!s.rounds.length) return `#/chon-so/${s.id}`;
  return `#/giai/${s.id}`;
}
