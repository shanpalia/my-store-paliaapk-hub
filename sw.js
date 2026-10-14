const CACHE_NAME='palia-store-offline-v4';
const APP_FILES=[
 './','./index.html','./sale.html','./purchase.html','./accounts.html','./items.html',
 './payment.html','./payment-receipt.html','./balance.html','./vouchers.html','./reports.html',
 './company-edit.html','./add-account.html','./add-item.html','./purregister.html',
 './page.js','./page.css','./script.js','./manifest.json','./app-icon.svg'
];
self.addEventListener('install',event=>{
 event.waitUntil((async()=>{
  const cache=await caches.open(CACHE_NAME);
  await Promise.all(APP_FILES.map(async path=>{try{const response=await fetch(path,{cache:'reload'});if(response.ok)await cache.put(path,response)}catch(e){}}));
  await self.skipWaiting();
 })());
});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(k=>k.startsWith('palia-store-offline-')&&k!==CACHE_NAME).map(k=>caches.delete(k)));
  await self.clients.claim();
 })());
});
self.addEventListener('fetch',event=>{
 const req=event.request;if(req.method!=='GET')return;
 const url=new URL(req.url);if(url.origin!==self.location.origin)return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE_NAME);
  const isPage=req.mode==='navigate'||/\\.html?$/i.test(url.pathname);
  // Always check the network first for HTML so GitHub Pages updates appear without manual refresh.
  if(isPage){
   try{
    const response=await fetch(req,{cache:'no-cache'});
    if(response.ok&&response.type==='basic')await cache.put(req,response.clone());
    return response;
   }catch(e){
    const cached=await cache.match(req,{ignoreSearch:false})||await cache.match(url.pathname.endsWith('/')?'./index.html':'./'+url.pathname.split('/').pop());
    if(cached)return cached;
    return new Response('Offline: please open the app once while connected to the internet.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
   }
  }
  const cached=await cache.match(req,{ignoreSearch:false})||await cache.match(url.pathname.endsWith('/')?'./index.html':'./'+url.pathname.split('/').pop());
  if(cached)return cached;
  try{
   const response=await fetch(req);
   if(response.ok&&response.type==='basic')await cache.put(req,response.clone());
   return response;
  }catch(e){return new Response('',{status:503});}
 })());
});