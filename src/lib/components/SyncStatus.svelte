<script lang="ts">
    import { onMount } from 'svelte';
    import { networkStatus} from "$lib/stores/networkStatus.js";

    let syncStatus = $state('idle');
    let syncError = $state<string | null>(null);
    let isOnline = $state(true);

    onMount(() => {
        console.log('test')
        // S'abonner aux changements d'état réseau
        const unsubscribe = networkStatus.subscribe(state => {
            isOnline = state.isOnline;
        });

        // Configurer le canal de communication avec le service worker
        const syncChannel = new BroadcastChannel('sync-channel');

        syncChannel.onmessage = (event) => {
            const { type, error } = event.data;
            console.log('syncStatus = ', type);
            switch (type) {
                case 'sync-start':
                    syncStatus = 'syncing';
                    syncError = null;
                    break;
                case 'sync-complete':
                    syncStatus = 'complete';
                    setTimeout(() => {
                        syncStatus = 'idle';
                    }, 3000);
                    break;
                case 'sync-error':
                    syncStatus = 'error';
                    syncError = error || 'Erreur de synchronisation inconnue';
                    break;
                case 'api-offline':
                    isOnline = false;
                    break;
                case 'connection-online':
                    isOnline = true;
                    break;
                case 'connection-offline':
                    isOnline = false;
                    break;
            }
        };

        return () => {
            unsubscribe();
            syncChannel.close();
        };
    });
</script>

<div class="sync-status">
    {#if !isOnline}
        <div class="status-badge offline">
            <span class="icon">⚠️</span>
            <span>Mode hors ligne</span>
        </div>
    {:else if syncStatus === 'syncing'}
        <div class="status-badge syncing">
            <span class="icon rotating">⟳</span>
            <span>Synchronisation...</span>
        </div>
    {:else if syncStatus === 'complete'}
        <div class="status-badge complete">
            <span class="icon">✓</span>
            <span>Synchronisé</span>
        </div>
    {:else if syncStatus === 'error'}
        <div class="status-badge error">
            <span class="icon">✗</span>
            <span>Erreur: {syncError}</span>
        </div>
    {/if}
</div>

<style>
    .sync-status {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 1000;
    }

    .status-badge {
        padding: 8px 12px;
        border-radius: 20px;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        transition: all 0.3s ease;
    }

    .offline {
        background-color: #ffe0b2;
        color: #e65100;
    }

    .syncing {
        background-color: #e3f2fd;
        color: #1976d2;
    }

    .complete {
        background-color: #e8f5e9;
        color: #2e7d32;
    }

    .error {
        background-color: #ffebee;
        color: #c62828;
    }

    .rotating {
        animation: rotate 1s linear infinite;
    }

    @keyframes rotate {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }
</style>