import { Workbox } from 'workbox-window';

// Fonction pour enregistrer le service worker
export function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        const wb = new Workbox('/service-worker.js', {
            type: 'module'
        });

        // Écouter les mises à jour
        wb.addEventListener('controlling', () => {
            window.location.reload(); // Recharger quand le nouveau SW prend le contrôle
        });

        // Enregistrer le service worker
        wb.register();
    }
}