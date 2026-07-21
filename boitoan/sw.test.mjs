import assert from "node:assert/strict";
import vm from "node:vm";
import { readFile } from "node:fs/promises";

const handlers = {};
const entries = new Map();
let fetchResponse;
let fetchCalls = 0;
let cachePutError;

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
    keys: async () => ["boitoan-v8", "boitoan-v9"],
    delete: async () => true,
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

function dispatch(url) {
  let response;
  handlers.fetch({
    request: new Request(url),
    respondWith(value) { response = Promise.resolve(value); }
  });
  return response;
}

assert.equal(dispatch("https://gate.example/api/status?id=old"), undefined);
assert.equal(dispatch("https://example.test/boitoan/api/status?id=old"), undefined);
assert.equal(fetchCalls, 0, "API requests must bypass the Service Worker");

fetchResponse = new Response("static", { status: 200 });
let response = await dispatch("https://example.test/boitoan/index.html?v=1");
assert.equal(await response.text(), "static");
assert(entries.has("https://example.test/boitoan/index.html"));

fetchResponse = new Response("missing", { status: 404 });
response = await dispatch("https://example.test/boitoan/gate.css");
assert.equal(response.status, 404);
assert(!entries.has("https://example.test/boitoan/gate.css"));

fetchResponse = new Error("offline");
response = await dispatch("https://example.test/boitoan/index.html?v=2");
assert.equal(await response.text(), "static");

entries.set("https://example.test/boitoan/gate.js", new Response("stale"));
fetchResponse = new Response("fresh", { status: 200 });
cachePutError = new Error("quota exceeded");
response = await dispatch("https://example.test/boitoan/gate.js");
assert.equal(await response.text(), "fresh", "cache write failure must not hide network response");

console.log("Service Worker cache security PASS");
