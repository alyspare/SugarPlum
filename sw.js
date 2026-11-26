// Keeps Sugar Plum working with no internet once it has been opened once.
const CACHE = 'sugar-plum-v2';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png', './icon-maskable-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => (k.startsWith('sugar-plum-') || k.startsWith('dating-journal-')) && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    // Try the network briefly so updates show up; otherwise use the saved copy.
    e.respondWith(Promise.race([
      fetch(req).then(r => { if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)); } return r; }),
      new Promise((_, rej) => setTimeout(() => rej(new Error('slow')), 3500))
    ]).catch(() => caches.open(CACHE).then(c => c.match('./index.html'))));
    return;
  }
  // only this app's own saved files, never another app's copy on the same site
  e.respondWith(caches.open(CACHE).then(c => c.match(req, {ignoreSearch: true})).then(r => r || fetch(req)));
});
