var CACHE="boitoan-v9";
// Dữ liệu (data*.js) & app.js đã được GỘP + MÃ HÓA trong index.html, không còn file rời.
var ASSETS=["./","index.html","gate.css","gate.js","manifest.webmanifest","icon.png"];
var ASSET_URLS=ASSETS.map(function(path){return new URL(path,self.registration.scope).href;});
self.addEventListener("install",function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(ASSETS);}).then(function(){return self.skipWaiting();}));
});
self.addEventListener("activate",function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){return k!==CACHE;}).map(function(k){return caches.delete(k);}));
  }).then(function(){return self.clients.claim();}));
});
self.addEventListener("fetch",function(e){
  if(e.request.method!=="GET")return;
  var url=new URL(e.request.url);
  url.search="";
  url.hash="";
  if(url.origin!==self.location.origin||ASSET_URLS.indexOf(url.href)===-1)return;
  e.respondWith(
    fetch(e.request).then(function(res){
      if(!res.ok)return res;
      return caches.open(CACHE).then(function(c){
        return c.put(url.href,res.clone());
      }).catch(function(){}).then(function(){return res;});
    }).catch(function(){return caches.match(url.href);})
  );
});
