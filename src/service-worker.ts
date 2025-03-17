/// <reference types="@sveltejs/kit" />
import { build, files, version } from '$service-worker';
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

// Précacher les fichiers de build et statiques
const precacheList = [...build, ...files].map(url => ({
    url,
    revision: version
}));

precacheAndRoute(precacheList);

// Cache pour les pages de navigation (HTML)
registerRoute(
    ({ request }) => request.mode === 'navigate',
    new NetworkFirst({
        cacheName: 'pages',
        plugins: [
            new CacheableResponsePlugin({
                statuses: [200]
            })
        ]
    })
);

// Cache pour les ressources statiques (images, polices, etc.)
registerRoute(
    ({ request }) =>
        request.destination === 'image' ||
        request.destination === 'font' ||
        request.destination === 'style',
    new CacheFirst({
        cacheName: 'assets',
        plugins: [
            new CacheableResponsePlugin({
                statuses: [200]
            }),
            new ExpirationPlugin({
                maxEntries: 50,
                maxAgeSeconds: 30 * 24 * 60 * 60 // 30 jours
            })
        ]
    })
);