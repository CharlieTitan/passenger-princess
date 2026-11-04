/* Private pages and API responses are deliberately never written to Cache Storage. */
const CACHE="us-public-v1";
const PUBLIC=["/offline.html","/icon-192.png","/icon-512.png","/apple-touch-icon.png","/icon.svg"];
self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(PUBLIC)).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch",event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=="GET"||url.origin!==self.location.origin)return;
  if(PUBLIC.includes(url.pathname)&&!url.search){
    event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request)));
  }else if(event.request.mode==="navigate"){
    event.respondWith(fetch(event.request,{cache:"no-store"}).catch(()=>caches.match("/offline.html")));
  }
  // API calls, Next.js payloads and all other resources use the network directly.
});
