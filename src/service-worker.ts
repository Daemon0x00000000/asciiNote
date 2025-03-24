import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, NetworkOnly, StaleWhileRevalidate } from 'workbox-strategies';
import { BackgroundSyncPlugin } from 'workbox-background-sync';
import { ExpirationPlugin } from 'workbox-expiration';

// Déclaration pour TypeScript
declare const self: ServiceWorkerGlobalScope;

// Créer un canal de communication pour les messages
const syncChannel = new BroadcastChannel('sync-channel');

// Configuration du plugin de synchronisation
const noteSyncPlugin = new BackgroundSyncPlugin('notes-sync-queue', {
    maxRetentionTime: 24 * 60, // Conserver les requêtes pendant 24 heures
    onSync: async ({ queue }) => {
        syncChannel.postMessage({ type: 'sync-start' });
        let syncSuccess = true;

        try {
            console.log("Service worker: début de la synchronisation");

            const requests = await queue.getAll();
            console.log(`Service worker: ${requests.length} requêtes à traiter`);

            // Traitement individuel pour meilleur débogage
            for (const request of requests) {
                try {
                    console.log(`Service worker: traitement de requête vers ${request.request.url}`);
                    await fetch(request.request.clone());
                    console.log(`Service worker: requête traitée avec succès`);
                } catch (err) {
                    console.error(`Service worker: échec de la requête:`, err);
                    throw err; // Rethrow pour traitement par le try/catch parent
                }
            }

            syncChannel.postMessage({ type: 'sync-complete' });
        } catch (error) {
            syncSuccess = false;
            console.error("Service worker: erreur de synchronisation:", error);
            syncChannel.postMessage({
                type: 'sync-error',
                error: error instanceof Error ? error.message : 'Erreur de synchronisation'
            });
        }

        return syncSuccess;
    },
});

// Précacher les ressources statiques
const manifestEntries = self.__WB_MANIFEST || [];
precacheAndRoute(manifestEntries);


// Intercepter les requêtes API notes en mode POST/PUT
registerRoute(
    ({ url }) => url.pathname.includes('/api/notes'),
    new NetworkOnly({
        plugins: [noteSyncPlugin]
    }),
    'POST'
);

registerRoute(
    ({ url }) => url.pathname.includes('/api/notes'),
    new NetworkOnly({
        plugins: [noteSyncPlugin]
    }),
    'PUT'
);

// Stratégie pour les autres routes de l'API
registerRoute(
    ({ url }) => url.pathname.startsWith('/api/'),
    new NetworkFirst({
        networkTimeoutSeconds: 3,
        cacheName: 'api-cache',
        plugins: [
            new ExpirationPlugin({
                maxEntries: 50,
                maxAgeSeconds: 5 * 60, // 5 minutes
            }),
        ],
    })
);

// Écouter les événements sync
self.addEventListener('sync', (event) => {
    if (event.tag === 'notes-sync') {
        event.waitUntil(noteSyncPlugin._queue.replayRequests());
    }
});

// Écouter les changements de connectivité
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'NETWORK_STATUS_CHANGE') {
        if (event.data.isOnline) {
            syncChannel.postMessage({ type: 'connection-online' });
            // Tentative immédiate de synchronisation quand on revient en ligne
            noteSyncPlugin._queue.replayRequests();
        } else {
            syncChannel.postMessage({ type: 'connection-offline' });
        }
    }
});

// Notifier l'application des changements de connectivité
self.addEventListener('online', () => {
    syncChannel.postMessage({ type: 'connection-online' });
    // Tentative immédiate de synchronisation
    self.registration.sync.register('notes-sync').catch(err => {
        console.error("Erreur lors de l'enregistrement de la synchronisation:", err);
    });
});



self.addEventListener('offline', () => {
    syncChannel.postMessage({ type: 'connection-offline' });
});