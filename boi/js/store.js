// Kho dữ liệu dùng chung cho các màn: phiên câu hỏi, cài đặt, khoá AI (chỉ localStorage máy người dùng).
import { loadSessions, saveSessions, createSession } from "./state.js";
import { LOCAL_KEY, LOCAL_BASE, via } from "./ai.js";

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
export function aiKey(provider = store.settings.aiProvider || "gemini") {
  let k = "";
  try { k = storage?.getItem(`${AIKEY_KEY}.${provider}`) || ""; } catch (_) { /* bỏ qua */ }
  return k || (provider === "gemini" && bridge.ok ? LOCAL_KEY : "");
}
// Dò cầu nối máy nhà: trên máy chủ nhân gọi 127.0.0.1; máy khác đã ghép (mã trong localStorage) thì lấy địa chỉ
// đường hầm mới nhất từ boi/cau_noi.json trên GitHub rồi gọi kèm mã. Không có thì im lặng dùng khoá hoặc động cơ luật.
const GHEP_KEY = "boi.v1.ghep";
const CAU_NOI_JSON = "https://api.github.com/repos/baominhle77-glitch/baominhle77-glitch.github.io/contents/boi/cau_noi.json?ref=main";
export const bridge = { ok: false, xa: false };
export const ghepToken = () => { try { return storage?.getItem(GHEP_KEY) || ""; } catch (_) { return ""; } };
export function setGhep(t) { try { if (t) storage?.setItem(GHEP_KEY, t); else storage?.removeItem(GHEP_KEY); return true; } catch (_) { return false; } }
async function ping(fetchImpl, base, token, ms) {
  const c = new AbortController(); const t = setTimeout(() => c.abort(), ms);
  try { const r = await fetchImpl(`${base}/ping`, { signal: c.signal, headers: token ? { "x-boi-token": token } : {} }); return r.ok; } finally { clearTimeout(t); }
}
export async function probeBridge(fetchImpl = globalThis.fetch) {
  try {
    if (await ping(fetchImpl, LOCAL_BASE, "", 1200)) { via.base = LOCAL_BASE; via.token = ""; bridge.ok = true; bridge.xa = false; return true; }
  } catch (_) { /* không ở máy nhà */ }
  const token = ghepToken();
  let ok = false;
  {  // không có mã ghép vẫn dò: cầu nối nhận trang web bói theo Origin (25/10)
    try {
      const r = await fetchImpl(CAU_NOI_JSON, { headers: { accept: "application/vnd.github.raw+json" }, cache: "no-store" });
      const url = r.ok ? String((await r.json()).url || "") : "";
      if (/^https:\/\/[\w.-]+$/.test(url) && await ping(fetchImpl, url + "/gemini", token, 6000)) { via.base = url + "/gemini"; via.token = token; ok = true; }
    } catch (_) { ok = false; }
  }
  bridge.ok = ok; bridge.xa = ok;
  return ok;
}
export function setAiKey(provider, key) {
  try { if (key) storage?.setItem(`${AIKEY_KEY}.${provider}`, key); else storage?.removeItem(`${AIKEY_KEY}.${provider}`); return true; } catch (_) { return false; }
}
export const aiReady = () => !!aiKey();

export const getSession = (id) => store.sessions.find((s) => s.id === id) || null;

export function newDraft(cauHoi, suggestion) {
  const now = new Date();
  const d = { v: 1, draft: true, id: "q" + now.getTime().toString(36) + Math.random().toString(36).slice(2, 6), cauHoi: cauHoi.trim(), suggestion, createdAt: now.toISOString(), lockedAt: now.toISOString(), rounds: [] };
  store.sessions.push(d);
  persist();
  return d;
}

// Khoá nháp: sinh seed + xáo + mã khoá; giữ nguyên id để link cũ vẫn mở đúng câu hỏi
export async function lockDraft(draft, cfg) {
  const s = await createSession({ cauHoi: draft.cauHoi, ...cfg });
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
