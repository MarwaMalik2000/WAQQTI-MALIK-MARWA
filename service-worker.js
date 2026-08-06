/* ============================================================
   WAQQTI — service-worker.js  (PWA)
   Stratégie : network-first, avec repli sur le cache hors-ligne.
   IMPORTANT : on N'INTERCEPTE JAMAIS les appels Supabase
   (données temps réel : rendez-vous, dispos…). Ils passent direct au réseau.
   À enregistrer en chemin ABSOLU : navigator.serviceWorker.register('/service-worker.js')
   ============================================================ */
var CACHE = 'waqqti-v3';

// Coquille de l'app mise en cache à l'installation (ajuste si besoin).
var PRECACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/config.js',
  '/assets/i18n.js',
  '/client/salon.html',
  '/pro/dashboard.html'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      // addAll échoue si une seule URL est absente → on tolère les manquants
      return Promise.allSettled(PRECACHE.map(function (u) { return cache.add(u); }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== CACHE) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  var req = event.request;
  var url = new URL(req.url);

  // Ne toucher qu'aux GET same-origin
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;

  // Exclure explicitement Supabase et toute API externe (sécurité + fraîcheur)
  if (url.hostname.indexOf('supabase') !== -1 ||
      url.hostname.indexOf('supabase.co') !== -1) {
    return; // laisse passer au réseau sans interception
  }

  // network-first : réseau d'abord, cache en secours
  event.respondWith(
    fetch(req).then(function (res) {
      if (res && res.status === 200 && res.type === 'basic') {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
      }
      return res;
    }).catch(function () {
      return caches.match(req).then(function (cached) {
        return cached || caches.match('/index.html');
      });
    })
  );
});
