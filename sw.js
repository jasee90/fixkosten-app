// Cache-first Service Worker: die App läuft nach dem ersten Laden auch offline.
// Die Version steht in js/version.js. Neue Versionen werden erst nach Tippen auf "Neue Version verfügbar" aktiv.
importScripts('js/version.js');
const VERSION = 'fixkosten-' + self.APP_VERSION;
const FILES = ['./', 'index.html', 'css/style.css', 'js/version.js', 'js/app.js', 'manifest.webmanifest',
  'icons/apple-touch-icon.png', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request)));
});

self.addEventListener('message', (e) => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});
