/* W라운지 오프라인 캐시 (선택사항) — network-first */
const CACHE = 'wlounge-v1';
self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(ch => ch.put(e.request, copy)).catch(()=>{});
        return res;
      })
      .catch(() => caches.match(e.request).then(m => m || caches.match('./')))
  );
});
