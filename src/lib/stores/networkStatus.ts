import { writable } from 'svelte/store';

export const networkStatus = writable({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    wasOffline: false
});

export function initNetworkListeners() {
    if (typeof window === 'undefined') return;

    const updateStatus = (isOnline) => {
        networkStatus.update(state => ({
            isOnline,
            wasOffline: !isOnline || (!state.isOnline && isOnline)
        }));
    };

    window.addEventListener('online', () => updateStatus(true));
    window.addEventListener('offline', () => updateStatus(false));

    // Initialisation
    updateStatus(navigator.onLine);
}