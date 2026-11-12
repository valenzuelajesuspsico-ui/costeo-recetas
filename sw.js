// Service worker: guarda la app para usarla sin internet.
// Con internet siempre carga primero la versión más nueva de la página; sin internet (o con señal muy lenta) usa la guardada.
// Este archivo lo genera fuente/build.js; no lo edites a mano.
const CACHE="costeo-a95a45ea5f";
const FILES=["./","./index.html","./manifest.json","./icon-192.png","./icon-512.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES.map(f=>new Request(f,{cache:"reload"})))).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
const guardar=(req,res)=>{if(res&&res.ok){const copia=res.clone();caches.open(CACHE).then(c=>c.put(req,copia))}return res};
self.addEventListener("fetch",e=>{
  const req=e.request;
  if(req.method!=="GET"||!req.url.startsWith(self.location.origin))return;
  const u=new URL(req.url);
  const esPagina=req.mode==="navigate"||u.pathname.endsWith("/")||u.pathname.endsWith("/index.html");
  if(esPagina){
    // Página: primero la red (sin usar la copia del navegador); si tarda más de 4 s o no hay señal, la guardada.
    e.respondWith((async()=>{
      const cache=await caches.open(CACHE);
      const guardada=await cache.match("./index.html")||await caches.match(req,{ignoreSearch:true});
      const red=fetch(u.origin+u.pathname,{cache:"no-store"}).then(r=>{if(r&&r.ok)cache.put("./index.html",r.clone());return r});
      if(!guardada)return red;
      const lento=new Promise(r=>setTimeout(()=>r(null),4000));
      try{const r=await Promise.race([red,lento]);if(r&&r.ok)return r}catch{}
      red.catch(()=>{});
      return guardada;
    })());
    return;
  }
  // Lo demás (iconos, manifest): la copia guardada y se refresca por detrás.
  e.respondWith(caches.match(req,{ignoreSearch:true}).then(cached=>{
    const net=fetch(req).then(r=>guardar(req,r)).catch(()=>cached);
    return cached||net;
  }));
});
