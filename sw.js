// Service worker do app instalável (PWA). Cache-first com fallback pra rede:
// qualquer arquivo do próprio site que já tenha sido buscado uma vez fica
// disponível offline, sem precisar manter aqui uma lista de todo `.js` novo
// (essa lista já existe em `index.html`/`test/mocks.js` — duplicar seria
// mais um lugar pra esquecer de atualizar).
const CACHE_NAME = 'rumo-as-profundezas-v1';
const APP_SHELL = ['./', './index.html', './styles.css', './manifest.webmanifest'];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches
            .open(CACHE_NAME)
            .then((cache) => cache.addAll(APP_SHELL))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) =>
                Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
            )
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const request = event.request;
    if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) {
        return;
    }

    event.respondWith(
        caches.match(request).then((cached) => {
            const network = fetch(request)
                .then((response) => {
                    if (response && response.ok) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                    }
                    return response;
                })
                .catch(() => {
                    if (request.mode === 'navigate') {
                        return caches.match('./index.html');
                    }
                    return cached;
                });
            return cached || network;
        })
    );
});
