var CACHE="hiennhi89-v1";
var ASSETS=["/manifest.webmanifest","/boitoan/icon.png","/assets/gate.css","/assets/gate.js"];
var ASSET_URLS=ASSETS.map(function(path){return new URL(path,self.registration.scope).href;});
self.addEventListener("install",function(event){
  event.waitUntil(caches.open(CACHE).then(function(cache){return cache.addAll(ASSETS);}).then(function(){return self.skipWaiting();}));
});
self.addEventListener("activate",function(event){
  event.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(key){return key.indexOf("hiennhi89-")===0&&key!==CACHE;}).map(function(key){return caches.delete(key);}));
  }).then(function(){return self.clients.claim();}));
});
self.addEventListener("fetch",function(event){
  if(event.request.method!=="GET"||event.request.mode==="navigate")return;
  var url=new URL(event.request.url);
  url.search="";
  url.hash="";
  if(url.origin!==self.location.origin||url.pathname.indexOf("/api/")===0||ASSET_URLS.indexOf(url.href)===-1)return;
  event.respondWith(fetch(event.request).then(function(response){
    if(!response.ok)return response;
    return caches.open(CACHE).then(function(cache){return cache.put(url.href,response.clone());}).catch(function(){}).then(function(){return response;});
  }).catch(function(){return caches.match(url.href);}));
});
