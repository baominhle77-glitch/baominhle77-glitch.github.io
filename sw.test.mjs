import assert from "node:assert/strict";
import vm from "node:vm";
import { readFile } from "node:fs/promises";

const handlers = {};
const entries = new Map();
let fetchCalls = 0;
let fetchResponse = new Response("asset");
const cache = {
  addAll: async () => {},
  put: async (key, response) => { entries.set(String(key), response); }
};
const sandbox = {
  URL, Request, Response,
  fetch: async () => { fetchCalls += 1; if (fetchResponse instanceof Error) throw fetchResponse; return fetchResponse; },
  caches: {
    open: async () => cache,
    keys: async () => ["hiennhi89-v0", "boitoan-v10", "hiennhi89-v1"],
    delete: async () => true,
    match: async (key) => entries.get(String(key))
  },
  self: {
    location: { origin: "https://example.test" },
    registration: { scope: "https://example.test/" },
    clients: { claim: async () => {} },
    skipWaiting: async () => {},
    addEventListener: (name, handler) => { handlers[name] = handler; }
  }
};
vm.runInNewContext(await readFile(new URL("./sw.js", import.meta.url), "utf8"), sandbox);

function dispatch(request) {
  let response;
  handlers.fetch({ request, respondWith(value) { response = Promise.resolve(value); } });
  return response;
}

assert.equal(dispatch({ method: "GET", mode: "navigate", url: "https://example.test/" }), undefined);
assert.equal(dispatch(new Request("https://example.test/index.html")), undefined);
assert.equal(dispatch(new Request("https://example.test/api/access")), undefined);
assert.equal(dispatch(new Request("https://backend.test/api/access")), undefined);
assert.equal(fetchCalls, 0, "navigation, HTML, API and cross-origin requests must bypass root Service Worker");

let response = await dispatch(new Request("https://example.test/assets/gate.js?v=2"));
assert.equal(await response.text(), "asset");
assert(entries.has("https://example.test/assets/gate.js"));

entries.set("https://example.test/manifest.webmanifest", new Response("cached"));
fetchResponse = new Error("offline");
response = await dispatch(new Request("https://example.test/manifest.webmanifest?v=3"));
assert.equal(await response.text(), "cached");

console.log("Root Service Worker security PASS");
