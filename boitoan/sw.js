var CACHE="boitoan-v10";
// Không cache HTML/navigation: index chứa payload mã hóa và phải luôn lấy từ mạng.
var ASSETS=["manifest.webmanifest","icon.png","/assets/gate.css","/assets/gate.js"];
var ASSET_URLS=ASSETS.map(function(path){return new URL(path,self.registration.scope).href;});
self.addEventListener("install",function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(ASSETS);}).then(function(){return self.skipWaiting();}));
});
self.addEventListener("activate",function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){return k.indexOf("boitoan-")===0&&k!==CACHE;}).map(function(k){return caches.delete(k);}));
  }).then(function(){return self.clients.claim();}));
});
self.addEventListener("fetch",function(e){
  if(e.request.method!=="GET"||e.request.mode==="navigate")return;
  var url=new URL(e.request.url);
  url.search="";
  url.hash="";
  if(url.origin!==self.location.origin||url.pathname.indexOf("/api/")===0||ASSET_URLS.indexOf(url.href)===-1)return;
  e.respondWith(
    fetch(e.request).then(function(res){
      if(!res.ok)return res;
      return caches.open(CACHE).then(function(c){
        return c.put(url.href,res.clone());
      }).catch(function(){}).then(function(){return res;});
    }).catch(function(){return caches.match(url.href);})
  );
});
