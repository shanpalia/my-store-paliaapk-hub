const CACHE_NAME='palia-store-offline-v1';
const APP_FILES=[
 './','./index.html','./sale.html','./purchase.html','./accounts.html','./items.html',
 './payment.html','./payment-receipt.html','./balance.html','./vouchers.html','./reports.html',
 './company-edit.html','./add-account.html','./add-item.html','./page.js','./page.css'
];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_FILES.map(url=>new Request(url,{cache:'reload'}))).catch(()=>{})).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('palia-store-')&&k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{
 const req=event.request;if(req.method!=='GET')return;
 const url=new URL(req.url);if(url.origin!==self.location.origin)return;
 if(req.mode==='navigate'){
  event.respondWith(fetch(req).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(req,copy));}return response;}).catch(async()=>{const exact=await caches.match(req);if(exact)return exact;const path=url.pathname.split('/').pop()||'index.html';return (await caches.match('./'+path))||(await caches.match('./index.html'))||Response.error();}));
 }else{
  event.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(response=>{if(response.ok)caches.open(CACHE_NAME).then(cache=>cache.put(req,response.clone()));return response;})));
 }
});