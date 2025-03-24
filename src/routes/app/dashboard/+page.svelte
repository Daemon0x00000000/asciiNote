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
</script>

<div class="container mx-auto px-4 py-8">
    <div class="flex justify-between items-center mb-8">
        <h1 class="text-3xl font-bold text-gray-800">Tableau de bord</h1>
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
        <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
            <p>{error}</p>
            <button class="mt-2 text-blue-600 hover:underline" on:click={() => window.location.reload()}>
                Réessayer
            </button>
        </div>
    {:else if notes.length === 0}
        <div class="bg-gray-50 rounded-lg p-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 class="mt-2 text-lg font-medium text-gray-900">Aucune note</h3>
            <p class="mt-1 text-gray-500">Commencez à créer vos notes dès maintenant</p>
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
        <div class="bg-white shadow overflow-hidden rounded-lg">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Titre
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dernière modification
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                    </th>
                </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                {#each notes as note}
                    <tr class="hover:bg-gray-50 cursor-pointer" on:click={() => handleNoteClick(note.id)}>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="flex items-center">
                                <div class="ml-4">
                                    <div class="text-sm font-medium text-gray-900">{note.title || 'Sans titre'}</div>
                                    <div class="text-sm text-gray-500 truncate max-w-xs">
                                        {note.content ? note.content.replace(/[*#=]/g, '').slice(0, 60) + '...' : 'Pas de contenu'}
                                    </div>
                                </div>
                            </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="text-sm text-gray-900">{formatDate(note.updatedAt)}</div>
                            <div class="text-xs text-gray-500">Créée {formatDate(note.createdAt)}</div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                <span class={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                  ${note.syncStatus === 'synced' ? 'bg-green-100 text-green-800' :
                  note.syncStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'}`}>
                  {note.syncStatus === 'synced' ? 'Synchronisé' :
                      note.syncStatus === 'pending' ? 'En attente' : 'Non synchronisé'}
                </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button class="text-blue-600 hover:text-blue-900 mr-3" on:click|stopPropagation={() => handleNoteClick(note.id)}>
                                Éditer
                            </button>
                            <button class="text-red-600 hover:text-red-900" on:click|stopPropagation={async () => {
                  if (confirm('Êtes-vous sûr de vouloir supprimer cette note ?')) {
                    await fetch(`/api/notes/${note.id}`, { method: 'DELETE' });
                    notes = notes.filter(n => n.id !== note.id);
                  }
                }}>
                                Supprimer
                            </button>
                        </td>
                    </tr>
                {/each}
                </tbody>
            </table>
        </div>
    {/if}
</div>