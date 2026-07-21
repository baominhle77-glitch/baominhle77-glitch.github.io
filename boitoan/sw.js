var CACHE="boitoan-v6";
var ASSETS=["./","index.html","gate.css","gate.js","data.js","data2.js","data3.js","data4.js","data5.js","app.js","manifest.webmanifest","icon.png"];
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
  e.respondWith(
    fetch(e.request).then(function(res){
      var copy=res.clone();
      caches.open(CACHE).then(function(c){c.put(e.request,copy);});
      return res;
    }).catch(function(){return caches.match(e.request,{ignoreSearch:true});})
  );
});
