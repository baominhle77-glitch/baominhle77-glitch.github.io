import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const HOST = "hiennhi89.pages.dev";
const KEY = "e4c968d6c15b4ef69083f88f4f8d1e76";
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
const ENDPOINT = "https://api.indexnow.org/indexnow";

const file = resolve(process.argv[2] || "_choice_seo/seo-urls.json");
const parsed = JSON.parse(await readFile(file, "utf8"));
const raw = Array.isArray(parsed) ? parsed : parsed.urls;
const urls = [...new Set((raw || []).map(String).filter((value) => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === HOST;
  } catch (_) {
    return false;
  }
}))].slice(0, 10000);

if (!urls.length) throw new Error("IndexNow không có URL hợp lệ");
const payload = { host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList: urls };

if (process.env.INDEXNOW_DRY_RUN === "1") {
  console.log(JSON.stringify({ dry_run: true, count: urls.length, host: HOST, key_location: KEY_LOCATION }));
  process.exit(0);
}

let response;
for (let attempt = 0; attempt < 2; attempt += 1) {
  response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(20000)
  }).catch(() => null);
  if (response && [200, 202].includes(response.status)) break;
  if (attempt === 0) await new Promise((resolvePromise) => setTimeout(resolvePromise, 1000));
}

if (!response || ![200, 202].includes(response.status)) {
  const body = response ? await response.text().catch(() => "") : "no_response";
  throw new Error(`IndexNow thất bại: ${response?.status || 0} ${body.slice(0, 200)}`);
}
console.log(`indexnow-ok: đã gửi ${urls.length} URL, HTTP ${response.status}`);
