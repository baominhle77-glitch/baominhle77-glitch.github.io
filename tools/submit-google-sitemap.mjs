import { createSign } from "node:crypto";

const raw = String(process.env.GOOGLE_SEARCH_CONSOLE_SERVICE_ACCOUNT_JSON || "").trim();
const siteUrl = String(process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL || "https://hiennhi89.pages.dev/");
const sitemapUrl = String(process.env.GOOGLE_SEARCH_CONSOLE_SITEMAP_URL || "https://hiennhi89.pages.dev/hoi-chon-dung/sitemap.xml");

if (!raw) {
  console.log("google-search-console-skip: chưa có service account được chủ sở hữu cấp quyền");
  process.exit(0);
}

function b64url(value) {
  return Buffer.from(value).toString("base64url");
}

let credentials;
try {
  credentials = JSON.parse(raw.startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8"));
} catch (_) {
  throw new Error("GOOGLE_SEARCH_CONSOLE_SERVICE_ACCOUNT_JSON không phải JSON/base64 hợp lệ");
}
if (!credentials.client_email || !credentials.private_key) throw new Error("Service account thiếu client_email/private_key");

if (process.env.GOOGLE_SEARCH_CONSOLE_DRY_RUN === "1") {
  console.log(JSON.stringify({ dry_run: true, service_account: credentials.client_email, site_url: siteUrl, sitemap_url: sitemapUrl }));
  process.exit(0);
}

const now = Math.floor(Date.now() / 1000);
const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
const payload = b64url(JSON.stringify({
  iss: credentials.client_email,
  scope: "https://www.googleapis.com/auth/webmasters",
  aud: "https://oauth2.googleapis.com/token",
  iat: now,
  exp: now + 3600
}));
const signingInput = `${header}.${payload}`;
const signer = createSign("RSA-SHA256");
signer.update(signingInput);
signer.end();
const assertion = `${signingInput}.${signer.sign(credentials.private_key).toString("base64url")}`;

const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion
  }),
  signal: AbortSignal.timeout(20000)
});
const tokenData = await tokenResponse.json().catch(() => ({}));
if (!tokenResponse.ok || !tokenData.access_token) throw new Error(`Không lấy được Google OAuth token: ${tokenResponse.status}`);

const endpoint = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/sitemaps/${encodeURIComponent(sitemapUrl)}`;
const submit = await fetch(endpoint, {
  method: "PUT",
  headers: { authorization: `Bearer ${tokenData.access_token}` },
  signal: AbortSignal.timeout(20000)
});
if (!submit.ok) {
  const body = await submit.text().catch(() => "");
  throw new Error(`Google Search Console sitemap submit thất bại: ${submit.status} ${body.slice(0, 200)}`);
}
console.log(`google-search-console-ok: đã gửi ${sitemapUrl}`);
