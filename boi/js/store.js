// Kho dữ liệu dùng chung cho các màn: phiên câu hỏi, cài đặt, khoá AI (chỉ localStorage máy người dùng).
import { loadSessions, saveSessions, createSession } from "./state.js";
import { LOCAL_KEY, LOCAL_BASE } from "./ai.js";

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
// Dò cầu nối máy nhà (chỉ có trên máy chủ nhân); không có thì im lặng dùng khoá hoặc động cơ luật.
export const bridge = { ok: false };
export async function probeBridge(fetchImpl = globalThis.fetch) {
  try {
    const c = new AbortController(); const t = setTimeout(() => c.abort(), 1200);
    const r = await fetchImpl(`${LOCAL_BASE}/ping`, { signal: c.signal }); clearTimeout(t);
    bridge.ok = r.ok;
  } catch (_) { bridge.ok = false; }
  return bridge.ok;
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
