// Kho dữ liệu dùng chung cho các màn: phiên câu hỏi, cài đặt (chỉ localStorage máy người dùng).
// AI mặc định đi qua trạm (không khoá trong web); cầu nối máy nhà chỉ dùng khi bật lựa chọn ẩn.
import { loadSessions, saveSessions, createSession } from "./state.js";
import { LOCAL_KEY, LOCAL_BASE, TRAM_KEY, via, datCuuTram } from "./ai.js";

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
export function aiKey() {
  return cauNoiAn() && bridge.ok ? LOCAL_KEY : TRAM_KEY;
}
// Khoá cũ từng dán ở bản trước không còn dùng → xoá khỏi máy (không còn nút xoá trong Cài đặt)
try { for (const p of ["gemini", "openai", "anthropic"]) storage?.removeItem(`${AIKEY_KEY}.${p}`); } catch (_) { /* bỏ qua */ }
// Lựa chọn ẩn: bật bằng link ?cau-noi=1 (tắt: ?cau-noi=0) hoặc link ghép ?ghep=<mã>
const CAU_NOI_KEY = "boi.v1.cau-noi";
export const cauNoiAn = () => { try { return storage?.getItem(CAU_NOI_KEY) === "1"; } catch (_) { return false; } };
export function setCauNoiAn(on) { try { if (on) storage?.setItem(CAU_NOI_KEY, "1"); else storage?.removeItem(CAU_NOI_KEY); return true; } catch (_) { return false; } }
// Dò cầu nối máy nhà: trên máy chủ nhân gọi 127.0.0.1; máy khác đã ghép (mã trong localStorage) thì lấy địa chỉ
// đường hầm mới nhất từ boi/cau_noi.json trên GitHub rồi gọi kèm mã. Không có thì im lặng dùng khoá hoặc động cơ luật.
const GHEP_KEY = "boi.v1.ghep";
const CAU_NOI_JSON = "https://api.github.com/repos/baominhle77-glitch/baominhle77-glitch.github.io/contents/boi/cau_noi.json?ref=main";
export const bridge = { ok: false, xa: false };
export const ghepToken = () => { try { return storage?.getItem(GHEP_KEY) || ""; } catch (_) { return ""; } };
export function setGhep(t) { try { if (t) { storage?.setItem(GHEP_KEY, t); setCauNoiAn(true); } else storage?.removeItem(GHEP_KEY); return true; } catch (_) { return false; } }
async function ping(fetchImpl, base, token, ms) {
  const c = new AbortController(); const t = setTimeout(() => c.abort(), ms);
  try { const r = await fetchImpl(`${base}/ping`, { signal: c.signal, headers: token ? { "x-boi-token": token } : {} }); return r.ok; } finally { clearTimeout(t); }
}
// Địa chỉ đường hầm mới nhất (đường hầm đổi địa chỉ ~20 phút/lần): ưu tiên API GitHub (có ngay khi máy nhà ghi lên main,
// không chờ Pages build); API lỗi hoặc 403 hết lượt thì đọc bản Pages kèm ?t= để khỏi dính bộ nhớ đệm. Không có → "".
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
// Mọi bước dò đều có hạn chờ: cầu nối tắt/treo hay GitHub chậm thì trả false, trang dùng trạm AI ngay.
export async function probeBridge(fetchImpl = globalThis.fetch, { on = cauNoiAn(), localMs = 1200, listMs = 5000, xaMs = 6000 } = {}) {
  if (!on) { bridge.ok = false; bridge.xa = false; return false; }
  try {
    if (await ping(fetchImpl, LOCAL_BASE, "", localMs)) { via.base = LOCAL_BASE; via.token = ""; bridge.ok = true; bridge.xa = false; return true; }
  } catch (_) { /* không ở máy nhà */ }
  const token = ghepToken();
  let ok = false;
  // không có mã ghép vẫn dò: cầu nối nhận trang web bói theo Origin (25/10)
  try {
    const url = await docDiaChiCauNoi(fetchImpl, listMs);
    if (url && await ping(fetchImpl, url + "/claude", token, xaMs)) { via.base = url + "/claude"; via.token = token; ok = true; }
  } catch (_) { ok = false; }
  bridge.ok = ok; bridge.xa = ok;
  return ok;
}
// Trạm 429/quá giờ → dò cầu nối một lần dù chưa bật cờ (thứ tự thường không đổi: chưa bật cờ thì trạm vẫn đứng đầu)
datCuuTram((fetchImpl) => probeBridge(fetchImpl, { on: true }));
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
