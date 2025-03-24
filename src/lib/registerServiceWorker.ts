import { Workbox } from 'workbox-window';
import { initNetworkListeners, networkStatus} from "$lib/stores/networkStatus.js";
import { get } from 'svelte/store';

// Fonction pour enregistrer le service worker
export function registerServiceWorker() {
    // Initialiser la surveillance réseau
    initNetworkListeners();

    if ('serviceWorker' in navigator) {
        try {
            const wb = new Workbox('/service-worker.js', {
                type: 'module'
            });

            navigator.permissions.query({name: 'background-sync'}).then((result) => {
                if (result.state === 'granted') {
                    console.log('La permission background-sync est accordée');
                } else {
                    console.warn('La permission background-sync est', result.state);
                }
            });

            // Créer le canal de communication pour les messages du service worker
            const syncChannel = new BroadcastChannel('sync-channel');
            syncChannel.onmessage = (event) => {
                const { type, error } = event.data;
                console.log('Message du service worker:', event.data);

                // Traiter les messages liés à la connectivité
                if (type === 'connection-online' || type === 'connection-offline') {
                    const isOnline = type === 'connection-online';
                    networkStatus.update(state => ({
                        isOnline,
                        wasOffline: !isOnline && state.isOnline
                    }));
                }

                // Si on revient en ligne après une période hors ligne, déclencher une synchronisation
                if (type === 'connection-online' && get(networkStatus).wasOffline) {
                    console.log('Tentative de synchronisation des notes après reconnexion');
                    navigator.serviceWorker.ready.then(registration => {
                        registration.sync.register('notes-sync');
                    });
                }

                if (type === 'connection-online') {
                    console.log('Connexion rétablie, tentative de synchronisation des notes');
                    // Envoyer un message à l'application pour déclencher la synchronisation
                    if (document.visibilityState === 'visible') {
                        // Si l'app est visible, synchroniser immédiatement
                        syncChannel.postMessage({ type: 'trigger-sync' });
                    }
                }


            };

            // Écouter les mises à jour
            wb.addEventListener('controlling', () => {
                console.log('Service worker prend le contrôle, rechargement de la page');
                window.location.reload();
            });

            // Écouter les erreurs
            wb.addEventListener('activated', () => {
                console.log('Service worker activé avec succès');
            });

            wb.addEventListener('installed', (event) => {
                console.log('Service worker installé', event);
            });

            wb.addEventListener('waiting', (event) => {
                console.log('Service worker en attente', event);
            });

            wb.addEventListener('redundant', (event) => {
                console.log('Service worker redondant', event);
            });

            wb.addEventListener('externalinstalled', (event) => {
                console.log('Service worker externe installé', event);
            });

            wb.addEventListener('externalactivated', (event) => {
                console.log('Service worker externe activé', event);
            });

            wb.addEventListener('externalwaiting', (event) => {
                console.log('Service worker externe en attente', event);
            });

            // Enregistrer le service worker
            wb.register()
                .then(registration => {
                    console.log('Service worker enregistré avec succès:', registration);

                    // Si on est en ligne, vérifier s'il y a des notes à synchroniser
                    if (get(networkStatus).isOnline) {
                        registration.sync.register('notes-sync').catch(err => {
                            console.error('Échec de l\'enregistrement de la synchronisation:', err);
                        });
                    }
                })
                .catch(error => {
                    console.error('Erreur lors de l\'enregistrement du service worker:', error);
                });
        } catch (error) {
            console.error('Erreur lors de l\'initialisation du service worker:', error);
        }
    } else {
        console.warn('Les service workers ne sont pas pris en charge par ce navigateur');
    }
}