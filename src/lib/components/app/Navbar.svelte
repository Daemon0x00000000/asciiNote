<script lang="ts">
    import { page } from '$app/stores';
    import { fly } from 'svelte/transition';
    import { theme} from "$lib/stores/theme.js";

    const {
        title = "AsciiNote",
        user = null,
        onToggleSidebar = () => {},
        onNewNote = () => {},
        onToggleTheme = () => {},
        onLogout = () => {},
        onSearch = (_query: string) => {} // Préfixé avec _ pour éviter le warning d'unused parameter
    } = $props();

    // État local
    let isMenuOpen = $state(false);
    let isMobileMenuOpen = $state(false);
    let isUserMenuOpen = $state(false);

    // Fonctions pour gérer les actions de navigation
    function toggleSidebar() {
        onToggleSidebar();
    }

    function newNote() {
        onNewNote();
    }

    function toggleTheme() {
        onToggleTheme();
    }

    function logout() {
        onLogout();
    }

    // Pour la recherche
    let searchQuery = $state('');
    function handleSearch() {
        if (searchQuery.trim()) {
            onSearch(searchQuery);
        }
    }

    // Fermer les menus quand on clique ailleurs
    function handleClickOutside() {
        if (isUserMenuOpen) isUserMenuOpen = false;
        if (isMobileMenuOpen) isMobileMenuOpen = false;
    }
</script>


<svelte:window on:click={handleClickOutside} />


<nav class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 fixed w-full z-50 shadow-sm">
    <div class="px-3 py-2 lg:px-5 lg:pl-3">
        <div class="flex items-center justify-between">
            <!-- Logo et bouton de menu latéral -->
            <div class="flex items-center">
                <button
                        type="button"
                        onclick={e => { e.stopPropagation(); toggleSidebar(); }}
                        class="inline-flex items-center p-2 text-sm rounded-lg text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
                >
                    <span class="sr-only">Ouvrir le menu</span>
                    <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fill-rule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"></path>
                    </svg>
                </button>

                <a href="/app" class="flex ml-2 md:mr-24 items-center">
                    <!-- Icône depuis votre dossier icons -->
                    <img src="/icons/icon-512x512.png" alt="AsciiNote Logo" class="h-8 w-8 mr-2" />
                    <span class="self-center text-xl font-semibold sm:text-2xl whitespace-nowrap dark:text-white">{title}</span>
                </a>
            </div>

            <!-- Recherche et actions -->
            <div class="flex items-center space-x-3">
                <!-- Barre de recherche -->
                <div class="hidden md:block">
                    <div class="relative">
                        <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <svg class="w-5 h-5 text-gray-500 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"></path>
                            </svg>
                        </div>
                        <form onsubmit={e => { e.preventDefault(); handleSearch(); }}>
                            <input
                                    bind:value={searchQuery}
                                    type="text"
                                    id="search-navbar"
                                    class="block w-full p-2 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                                    placeholder="Rechercher..."
                            >
                        </form>
                    </div>
                </div>

                <!-- Bouton nouvelle note -->
                <button
                        onclick={newNote}
                        class="p-2 text-gray-500 rounded-lg hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700 focus:ring-2 focus:ring-red-500"
                >
                    <span class="sr-only">Nouvelle note</span>
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                    </svg>
                </button>

                <!-- Bouton thème -->
                <button
                        onclick={toggleTheme}
                        class="text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 rounded-lg text-sm p-2.5"
                >
                    {#if $theme === 'dark'}
                        <!-- Icône soleil (mode clair) -->
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" fill-rule="evenodd" clip-rule="evenodd"></path>
                        </svg>
                    {:else}
                        <!-- Icône lune (mode sombre) -->
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path>
                        </svg>
                    {/if}
                    <span class="sr-only">Changer le thème</span>
                </button>


                <!-- Menu utilisateur -->
                {#if user}
                    <div class="relative ml-3">
                        <button
                                type="button"
                                class="flex rounded-full bg-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700"
                                onclick={e => { e.stopPropagation(); isUserMenuOpen = !isUserMenuOpen; }}

                        >
                            <span class="sr-only">Menu utilisateur</span>
                            {#if user.avatar}
                                <img class="h-8 w-8 rounded-full" src={user.avatar} alt="Avatar utilisateur">
                            {:else}
                                <div class="h-8 w-8 rounded-full bg-red-600 dark:bg-red-700 flex items-center justify-center text-white font-semibold">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                            {/if}
                        </button>

                        {#if isUserMenuOpen}
                            <div
                                    in:fly={{ y: -5, duration: 150 }}
                                    class="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-gray-800 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                            >
                                <div class="px-4 py-2 text-sm text-gray-700 dark:text-gray-200 border-b dark:border-gray-700">
                                    Connecté(e) en tant que <span class="font-semibold">{user.name}</span>
                                </div>
                                <a href="/app/profil" class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                                    Profil
                                </a>
                                <a href="/app/parametres" class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                                    Paramètres
                                </a>
                                <button
                                        onclick={logout}
                                        class="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    Déconnexion
                                </button>
                            </div>
                        {/if}
                    </div>
                {:else}
                    <a
                            href="/login"
                            class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500"
                    >
                        Connexion
                    </a>
                {/if}

                <!-- Menu mobile -->
                <button
                        onclick={(e) => { e.stopPropagation(); isMobileMenuOpen = !isMobileMenuOpen; }}
                        type="button"
                        class="inline-flex items-center p-2 ml-1 text-sm rounded-lg md:hidden text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
                >
                    <span class="sr-only">Ouvrir le menu</span>
                    <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fill-rule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"></path>
                    </svg>
                    <svg class="hidden w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                    </svg>
                </button>
            </div>
        </div>

        <!-- Menu mobile -->
        {#if isMobileMenuOpen}
            <div
                    in:fly={{ y: -5, duration: 150 }}
                    class="md:hidden mt-4"
            >
                <div class="px-2 pt-2 pb-3 space-y-1">
                    <div class="relative mb-3">
                        <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <svg class="w-5 h-5 text-gray-500 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"></path>
                            </svg>
                        </div>
                        <form onsubmit={e => { e.preventDefault(); handleSearch(); }}>
                            <input
                                    bind:value={searchQuery}
                                    type="text"
                                    id="search-navbar-mobile"
                                    class="block w-full p-2 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                                    placeholder="Rechercher..."
                            >
                        </form>
                    </div>

                    <a href="/app" class="block px-3 py-2 text-base font-medium rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-200 dark:hover:text-white dark:hover:bg-gray-700">
                        Tableau de bord
                    </a>
                    <a href="/app/notes" class="block px-3 py-2 text-base font-medium rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-200 dark:hover:text-white dark:hover:bg-gray-700">
                        Mes notes
                    </a>
                    <a href="/app/favoris" class="block px-3 py-2 text-base font-medium rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-200 dark:hover:text-white dark:hover:bg-gray-700">
                        Favoris
                    </a>
                </div>
            </div>
        {/if}
    </div>
</nav>