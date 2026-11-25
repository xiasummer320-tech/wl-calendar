/* 万年历 · 离线缓存：装到主屏幕后，即使服务/公网地址已失效，也能从缓存打开 */
const CACHE = 'wnl-page-v1';

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    try {
      const r = await fetch('/', { cache: 'no-store' });
      if (r && r.ok) {
        const c = await caches.open(CACHE);
        await c.put('/', r);
      }
    } catch (err) { }
    self.skipWaiting();
  })());
});
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.mode === 'navigate' || url.pathname === '/' || url.pathname === '/sw.js' || url.pathname.endsWith('apple-touch-icon.png')) {
    e.respondWith((async () => {
      try {
        const net = await fetch(e.request, { cache: 'no-store' });
        if (e.request.mode === 'navigate' && net.ok) {
          const c = await caches.open(CACHE);
          await c.put('/', net.clone());
        }
        return net;
      } catch (err) {
        const c = await caches.open(CACHE);
        const hit = await c.match('/');
        if (hit) return hit;
        throw err;
      }
    })());
  }
});
