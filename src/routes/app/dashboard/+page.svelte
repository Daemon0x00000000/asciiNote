<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { formatDistanceToNow } from 'date-fns';
    import { fr } from 'date-fns/locale';

    let notes = [];
    let loading = true;
    let error = null;

    onMount(async () => {
        try {
            const response = await fetch('/api/notes');
            if (!response.ok) throw new Error('Erreur lors du chargement des notes');
            notes = await response.json();
            console.log(notes)
            loading = false;
        } catch (err) {
            error = err.message;
            loading = false;
        }
    });

    function formatDate(dateString) {
        return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: fr });
    }

    function handleNoteClick(id) {
        goto(`/app/editor/${id}`);
    }

    function createNewNote() {
        goto('/app/editor/new');
    }

    function getStatusLabel(status) {
        switch (status) {
            case 'synced': return 'Synchronisé';
            case 'pending': return 'En attente';
            case 'error': return 'Erreur';
            default: return 'Local';
        }
    }

    function getStatusClasses(status) {
        switch (status) {
            case 'synced':
                return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
            case 'pending':
                return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
            case 'error':
                return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
            default:
                return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
        }
    }
</script>


<div class="container mx-auto px-4 py-8">
    <div class="flex justify-between items-center mb-8">
        <h1 class="text-3xl font-bold text-gray-800 dark:text-gray-100">Tableau de bord</h1>
        <button
                on:click={createNewNote}
                class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"
        >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            Nouvelle Note
        </button>
    </div>

    {#if loading}
        <div class="flex justify-center items-center h-64">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    {:else if error}
        <div class="bg-red-100 dark:bg-red-900 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 rounded">
            <p>{error}</p>
            <button class="mt-2 text-blue-600 dark:text-blue-400 hover:underline" on:click={() => window.location.reload()}>
                Réessayer
            </button>
        </div>
    {:else if notes.length === 0}
        <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 class="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100">Aucune note</h3>
            <p class="mt-1 text-gray-500 dark:text-gray-400">Commencez à créer vos notes dès maintenant</p>
            <div class="mt-6">
                <button
                        on:click={createNewNote}
                        class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
                >
                    Créer une note
                </button>
            </div>
        </div>
    {:else}
        <div class="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead class="bg-gray-50 dark:bg-gray-700">
                <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Titre
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Dernière modification
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Statut
                    </th>
                </tr>
                </thead>
                <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {#each notes as note}
                    <tr class="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer" on:click={() => handleNoteClick(note.id)}>
                        <td class="px-6 py-4">
                            <div class="flex items-center">
                                <div class="ml-4">
                                    <div class="text-sm font-medium text-gray-900 dark:text-gray-100">{note.title || 'Sans titre'}</div>
                                </div>
                            </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="text-sm text-gray-500 dark:text-gray-400">{formatDate(note.updatedAt)}</div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                    <span class={`inline-flex px-2 py-1 text-xs rounded-full ${getStatusClasses(note.syncStatus)}`}>
                        {getStatusLabel(note.syncStatus)}
                    </span>
                        </td>
                    </tr>
                {/each}
                </tbody>
            </table>
        </div>
    {/if}
</div>