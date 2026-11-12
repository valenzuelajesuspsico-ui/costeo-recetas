// Service worker: guarda la app para usarla sin internet y toma la versión nueva cuando hay señal.
const CACHE="costeo-v10";
const FILES=["./","./index.html","./manifest.json","./icon-192.png","./icon-512.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET"||!e.request.url.startsWith(self.location.origin))return;
  e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(cached=>{
    const net=fetch(e.request).then(r=>{if(r&&r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy))}return r}).catch(()=>cached);
    return cached||net;
  }));
});
