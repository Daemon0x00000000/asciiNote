<script>
    import Navbar from '$lib/components/app/Navbar.svelte';
    import { theme } from '$lib/stores/theme';
    import { cubicOut } from 'svelte/easing';
    import SyncStatus from "$lib/components/SyncStatus.svelte";
    import { goto } from '$app/navigation';
    import { tweened } from 'svelte/motion';
    import { onMount } from 'svelte';
    import { getNoteStore } from '$lib/stores/notes';
    import { page } from '$app/stores';


    const noteStore = getNoteStore();

    // Notes récentes (les 3 dernières)
    let recentNotes = $state([]);

    let currentNoteId = $state('');

    $effect(() => {
        if ($page.params.id) {
            currentNoteId = $page.params.id;
        }
    });


    // Surveiller les changements dans le store de notes et mettre à jour les notes récentes
    $effect(() => {
        if ($noteStore && $noteStore.notes) {
            recentNotes = [...$noteStore.notes]
                .sort((a, b) => {
                    const dateA = a.updatedAt || a.createdAt;
                    const dateB = b.updatedAt || b.createdAt;
                    return new Date(dateB).getTime() - new Date(dateA).getTime();
                })
                .slice(0, 3);
        }
    });

    let isSidebarOpen = $state(true);

    // Valeur animée pour la largeur du panneau latéral
    const sidebarWidth = tweened(256, {
        duration: 300,
        easing: cubicOut
    });

    // Mettre à jour la largeur animée quand le panneau change d'état
    $effect(() => {
        sidebarWidth.set(isSidebarOpen ? 256 : 0);
    });

    function handleToggleSidebar() {
        isSidebarOpen = !isSidebarOpen;
    }

    function handleToggleTheme() {
        theme.toggleTheme();
    }

    function handleNewNote() {
        goto('/app/editor/new');
    }

    function goToNote(id) {
        goto(`/app/editor/${id}`);
    }

    const user = { name: 'Jean Dupont', avatar: null };

    let { children } = $props();

    // S'assurer de charger les notes au démarrage
    onMount(() => {
        noteStore.loadNotes();
    });
</script>

<SyncStatus />

<Navbar
        title="AsciiNote"
        {user}
        onToggleSidebar={handleToggleSidebar}
        onNewNote={handleNewNote}
        onToggleTheme={handleToggleTheme}
        onLogout={() => console.log('Déconnexion')}
        onSearch={(query) => console.log('Recherche:', query)}
/>

<div class="flex h-screen">
    <div class="fixed top-0 left-0 h-full z-10 overflow-hidden" style="width: {$sidebarWidth}px;">
        <aside class="sidebar w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 pt-16 h-full">
            <div class="h-full px-3 py-4 overflow-y-auto">
                <ul class="space-y-2 font-medium">
                    <li>
                        <a href="/app/dashboard" class="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group">
                            <svg class="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            <span class="ml-3">Tableau de bord</span>
                        </a>
                    </li>

                    <!-- Section Notes récentes -->
                    <li class="pt-5">
                        <h2 class="px-2 text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                            Notes récentes
                        </h2>
                        <ul class="mt-2 space-y-1">
                            {#if recentNotes.length === 0}
                                <li class="px-2 py-1 text-gray-500 dark:text-gray-400 text-sm italic">
                                    Aucune note récente
                                </li>
                            {:else}
                                {#each recentNotes as note (note.id)}
                                    <li>
                                        <button
                                                on:click={() => goToNote(note.id)}
                                                class="w-full text-left flex items-center p-2 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 group {currentNoteId === note.id ? 'bg-gray-100 dark:bg-gray-700' : ''}"
                                        >
                                            <svg class="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                            <div class="truncate max-w-[170px]" title={note.title}>
                                                {note.title || "Sans titre"}
                                            </div>
                                        </button>
                                    </li>
                                {/each}
                            {/if}
                        </ul>
                    </li>
                </ul>
            </div>
        </aside>
    </div>

    <main class="relative w-full overflow-y-auto bg-gray-50 dark:bg-gray-900 p-4 pt-16 text-gray-900 dark:text-gray-100"
          style="margin-left: {$sidebarWidth}px;">
        {@render children()}
    </main>
</div>