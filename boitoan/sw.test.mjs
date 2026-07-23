import assert from "node:assert/strict";
import vm from "node:vm";
import { readFile } from "node:fs/promises";

const handlers = {};
const entries = new Map();
let fetchResponse;
let fetchCalls = 0;
let cachePutError;
const deletedCaches = [];

const cache = {
  addAll: async () => {},
  put: async (key, response) => {
    if (cachePutError) throw cachePutError;
    entries.set(String(key), response);
  }
};
const sandbox = {
  URL,
  Request,
  Response,
  fetch: async () => {
    fetchCalls += 1;
    if (fetchResponse instanceof Error) throw fetchResponse;
    return fetchResponse;
  },
  caches: {
    open: async () => cache,
    keys: async () => ["hiennhi89-v2", "boitoan-v10", "boitoan-v11", "boitoan-v12", "boitoan-v13", "boitoan-v14", "boitoan-v15", "boitoan-v16", "boitoan-v17", "boitoan-v19"],
    delete: async (key) => { deletedCaches.push(key); return true; },
    match: async (key) => entries.get(String(key))
  },
  self: {
    location: { origin: "https://example.test" },
    registration: { scope: "https://example.test/boitoan/" },
    clients: { claim: async () => {} },
    skipWaiting: async () => {},
    addEventListener: (name, handler) => { handlers[name] = handler; }
  }
};

vm.runInNewContext(await readFile(new URL("./sw.js", import.meta.url), "utf8"), sandbox);

let activation;
handlers.activate({ waitUntil(value) { activation = Promise.resolve(value); } });
await activation;
assert.deepEqual(deletedCaches, ["boitoan-v10", "boitoan-v11", "boitoan-v12", "boitoan-v13", "boitoan-v14", "boitoan-v15", "boitoan-v16", "boitoan-v17"], "Bói toán must preserve caches owned by root Service Worker and current v19");

function dispatch(url, init) {
  let response;
  handlers.fetch({
    request: init && init.mode === "navigate" ? { method: "GET", mode: "navigate", url } : new Request(url),
    respondWith(value) { response = Promise.resolve(value); }
  });
  return response;
}

assert.equal(dispatch("https://gate.example/api/status?id=old"), undefined);
assert.equal(dispatch("https://example.test/boitoan/api/status?id=old"), undefined);
assert.equal(fetchCalls, 0, "API requests must bypass the Service Worker");

assert.equal(dispatch("https://example.test/boitoan/", { mode: "navigate" }), undefined);
assert.equal(dispatch("https://example.test/boitoan/index.html"), undefined);
assert.equal(fetchCalls, 0, "encrypted HTML and navigation must bypass the Service Worker");

fetchResponse = new Response("missing", { status: 404 });
let response = await dispatch("https://example.test/assets/gate.css");
assert.equal(response.status, 404);
assert(!entries.has("https://example.test/assets/gate.css"));

entries.set("https://example.test/boitoan/manifest.webmanifest", new Response("static"));
fetchResponse = new Error("offline");
response = await dispatch("https://example.test/boitoan/manifest.webmanifest?v=2");
assert.equal(await response.text(), "static");

entries.set("https://example.test/assets/gate.js", new Response("stale"));
fetchResponse = new Response("fresh", { status: 200 });
cachePutError = new Error("quota exceeded");
response = await dispatch("https://example.test/assets/gate.js");
assert.equal(await response.text(), "fresh", "cache write failure must not hide network response");

console.log("Service Worker cache security PASS");
