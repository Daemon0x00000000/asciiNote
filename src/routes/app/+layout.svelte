<script>
    import Navbar from '$lib/components/app/Navbar.svelte';
    import { browser } from '$app/environment';
    import { theme } from '$lib/stores/theme';
    import { onMount } from "svelte";
    import { fly, slide } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';
    import SyncStatus from "$lib/components/SyncStatus.svelte";




    let isSidebarOpen = $state(true);


    function handleToggleSidebar() {
        isSidebarOpen = !isSidebarOpen;
    }

    function handleToggleTheme() {
        theme.toggleTheme();

    }

    const user = { name: 'Jean Dupont', avatar: null };

    let { children } = $props();

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




<div class="flex h-screen"> <!-- Utiliser h-screen au lieu de h-[calc(100vh-4rem)] -->

    {#if isSidebarOpen}
        <aside
                class="sidebar w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 pt-16"
                transition:fly={{ x: -300, duration: 300, easing: quintOut }}
        >
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
                </ul>
            </div>
        </aside>
    {/if}




    <main class="relative w-full overflow-y-auto bg-gray-50 dark:bg-gray-900 p-4 pt-16">
        {@render children()}
    </main>
</div>


<style>
</style>