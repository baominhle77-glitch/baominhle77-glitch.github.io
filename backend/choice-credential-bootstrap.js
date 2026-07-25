import { runChoiceAutopilot } from "./choice-autopilot.js";

const API_BASE = "https://api.accesstrade.vn";
const CREDENTIAL_KEY = "choice:autopilot:credential:v1";
const BOOTSTRAP_KEYPAIR_KEY = "choice:credential:bootstrap:keypair:v1";
const BOOTSTRAP_USED_KEY = "choice:credential:bootstrap:used:v1";
const EXPECTED_TOKEN_SHA256 = "0af82fcf683496c1109f8b72a6e06631d6c5bef7e50c7c87559c0a2ffa66155b";
const KEYPAIR_TTL_SECONDS = 30 * 60;
const enc = new TextEncoder();

function clean(value, max = 1600) {
  return String(value ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function b64url(bytes) {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function unb64url(value) {
  const normalized = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - normalized.length % 4) % 4);
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
}

async function sha256Hex(value) {
  const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(String(value))));
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function expectedTokenHash(env) {
  const override = clean(env.CHOICE_BOOTSTRAP_EXPECTED_SHA256, 64).toLowerCase();
  return /^[a-f0-9]{64}$/.test(override) ? override : EXPECTED_TOKEN_SHA256;
}

async function deriveCredentialKey(env) {
  const secret = clean(env.SESSION_SECRET, 500);
  if (secret.length < 32) throw new Error("session_secret_missing");
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(`${secret}:choice-autopilot-credential-v1`));
  return crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, ["encrypt"]);
}

async function encryptCredential(env, token) {
  const key = await deriveCredentialKey(env);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = new Uint8Array(await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(token)
  ));
  return JSON.stringify({
    v: 1,
    iv: btoa(String.fromCharCode(...iv)),
    data: btoa(String.fromCharCode(...encrypted)),
    created_at: new Date().toISOString()
  });
}

async function validatePublisherToken(token, fetchImpl = fetch) {
  const url = new URL(`${API_BASE}/v1/campaigns`);
  url.searchParams.set("limit", "1");
  url.searchParams.set("page", "1");
  const response = await fetchImpl(url.toString(), {
    headers: {
      accept: "application/json",
      authorization: `Token ${token}`
    }
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`accesstrade_http_${response.status}`);
  if (data?.status === false) throw new Error(clean(data?.message, 160) || "accesstrade_rejected");
  if (!Array.isArray(data?.data) && !Number.isFinite(Number(data?.total))) {
    throw new Error("accesstrade_campaigns_unavailable");
  }
  return true;
}

async function ensureBootstrapKeypair(env) {
  if (await env.KV.get(BOOTSTRAP_USED_KEY)) return null;
  const existing = await env.KV.get(BOOTSTRAP_KEYPAIR_KEY);
  if (existing) return JSON.parse(existing).public_jwk;

  const pair = await crypto.subtle.generateKey(
    { name: "RSA-OAEP", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
    true,
    ["encrypt", "decrypt"]
  );
  const publicJwk = await crypto.subtle.exportKey("jwk", pair.publicKey);
  const privateJwk = await crypto.subtle.exportKey("jwk", pair.privateKey);
  await env.KV.put(BOOTSTRAP_KEYPAIR_KEY, JSON.stringify({
    public_jwk: publicJwk,
    private_jwk: privateJwk,
    created_at: new Date().toISOString()
  }), { expirationTtl: KEYPAIR_TTL_SECONDS });
  return publicJwk;
}

async function ingestCredential(env, cipherText, fetchImpl = fetch) {
  if (await env.KV.get(BOOTSTRAP_USED_KEY)) throw new Error("bootstrap_already_used");
  const raw = await env.KV.get(BOOTSTRAP_KEYPAIR_KEY);
  if (!raw) throw new Error("bootstrap_key_expired");
  const material = JSON.parse(raw);
  const privateKey = await crypto.subtle.importKey(
    "jwk",
    material.private_jwk,
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["decrypt"]
  );
  const clear = await crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    privateKey,
    unb64url(cipherText)
  );
  const token = clean(new TextDecoder().decode(clear), 1200);
  if (await sha256Hex(token) !== expectedTokenHash(env)) throw new Error("credential_hash_mismatch");
  await validatePublisherToken(token, fetchImpl);
  await env.KV.put(CREDENTIAL_KEY, await encryptCredential(env, token));
  await env.KV.put(BOOTSTRAP_USED_KEY, JSON.stringify({ connected_at: new Date().toISOString() }));
  await env.KV.delete?.(BOOTSTRAP_KEYPAIR_KEY);
  const autopilot = await runChoiceAutopilot(env, { trigger: "secure_bootstrap", fetchImpl });
  return {
    connected: true,
    autopilot_ok: !!autopilot?.ok,
    selected_products: Number(autopilot?.status?.selected_products || 0),
    mode: clean(autopilot?.status?.mode || autopilot?.status?.error || "connected", 80)
  };
}

function headers(contentType = "application/json; charset=utf-8") {
  return {
    "content-type": contentType,
    "cache-control": "no-store, private",
    "x-content-type-options": "nosniff",
    "x-robots-tag": "noindex, nofollow, noarchive",
    "referrer-policy": "no-referrer"
  };
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: headers() });
}

export async function handleChoiceCredentialBootstrapRequest(request, env) {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/owner/choice/credential/")) return null;

  if (url.pathname === "/owner/choice/credential/public-key" && request.method === "GET") {
    const publicJwk = await ensureBootstrapKeypair(env);
    if (!publicJwk) return json({ error: "bootstrap_already_used" }, 410);
    return json({ algorithm: "RSA-OAEP-256", public_jwk: publicJwk });
  }

  if (url.pathname === "/owner/choice/credential/ingest" && request.method === "GET") {
    const cipher = clean(url.searchParams.get("cipher"), 1200);
    if (!cipher) return json({ error: "cipher_missing" }, 400);
    try {
      return json(await ingestCredential(env, cipher));
    } catch (error) {
      return json({ error: clean(error?.message, 160) || "bootstrap_failed" }, 400);
    }
  }

  return json({ error: "not_found" }, 404);
}

export const __test = {
  EXPECTED_TOKEN_SHA256,
  CREDENTIAL_KEY,
  BOOTSTRAP_KEYPAIR_KEY,
  BOOTSTRAP_USED_KEY,
  sha256Hex,
  expectedTokenHash,
  ensureBootstrapKeypair,
  ingestCredential,
  validatePublisherToken
};
