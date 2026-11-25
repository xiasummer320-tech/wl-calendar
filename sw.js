/* 万年历 · 离线缓存：装到主屏幕后，即使服务/公网地址已失效，也能从缓存打开 */
const CACHE = 'wnl-page-v2';

function pageKey() {
  try { return self.registration.scope; } catch (e) { return './'; }
}

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    try {
      const key = pageKey();
      const r = await fetch(key, { cache: 'no-store' });
      if (r && r.ok) {
        const c = await caches.open(CACHE);
        await c.put(key, r);
      }
    } catch (err) { }
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    } catch (err) { }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.mode !== 'navigate' && !new URL(req.url).pathname.endsWith('sw.js')) return;
  e.respondWith((async () => {
    const key = pageKey();
    try {
      const net = await fetch(req, { cache: 'no-store' });
      if (req.mode === 'navigate' && net.ok) {
        const c = await caches.open(CACHE);
        await c.put(key, net.clone());
      }
      return net;
    } catch (err) {
      const c = await caches.open(CACHE);
      const hit = await c.match(key) || await c.match(req);
      if (hit) return hit;
      throw err;
    }
  })());
});
