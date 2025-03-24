<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { goto } from '$app/navigation';
    import { v4 as uuidv4 } from 'uuid';
    import { fly } from 'svelte/transition';
    import { page } from '$app/stores';
    import AsciiDocViewer from '$lib/components/AsciiDocViewer.svelte';

    // État de la note
    let note = {
        id: '',
        title: '',
        content: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        syncStatus: 'pending',
        lastSynced: null
    };

    let viewMode = 'edit'; // 'edit', 'preview', 'split'


    // Variables d'état
    let loading = true;
    let error = null;
    let saving = false;
    let savedMessage = '';
    let previewMode = false;
    let saveTimeout;
    let titleChanged = false;
    let contentChanged = false;
    let autoSaveEnabled = true;

    // ID de la note depuis l'URL
    const noteId = $page.params.id === 'new' ? uuidv4() : $page.params.id;

    // Chargement de la note
    onMount(async () => {
        if ($page.params.id !== 'new') {
            try {
                const response = await fetch(`/api/notes/${noteId}`);

                if (response.ok) {
                    note = await response.json();
                } else if (response.status === 404) {
                    // Si la note n'existe pas, on crée une nouvelle note avec l'ID fourni
                    note = {
                        id: noteId,
                        title: 'Nouvelle note',
                        content: '',
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        syncStatus: 'pending',
                        lastSynced: null
                    };
                } else {
                    throw new Error('Erreur lors du chargement de la note');
                }
            } catch (err) {
                error = err.message;
            } finally {
                loading = false;
            }
        } else {
            note.id = noteId;
            loading = false;
        }
    });

    // Nettoyage des timeouts
    onDestroy(() => {
        if (saveTimeout) clearTimeout(saveTimeout);
    });

    function extractTitleFromContent() {
        if (!titleChanged && note.content) {
            // Cherche un titre de niveau 1 (= Titre)
            const titleMatch = note.content.match(/^=\s+(.+)$/m);
            if (titleMatch && titleMatch[1]) {
                note.title = titleMatch[1].trim();
            }
        }
    }

    async function saveNote() {
        if (!note.title || !note.id) return;

        saving = true;

        try {
            note.updatedAt = new Date().toISOString();
            note.syncStatus = 'pending';

            const response = await fetch(`/api/notes/${note.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(note)
            });

            if (!response.ok) {
                throw new Error("Erreur lors de l'enregistrement de la note");
            }

            const updatedNote = await response.json();
            note = updatedNote;

            // Afficher le message de sauvegarde
            savedMessage = 'Note enregistrée !';
            setTimeout(() => {
                savedMessage = '';
            }, 3000);

            // Réinitialiser les flags de modification
            titleChanged = false;
            contentChanged = false;
        } catch (err) {
            error = err.message;
            console.error("Erreur lors de l'enregistrement:", err);
        } finally {
            saving = false;
        }
    }

    // Gestion des modifications avec sauvegarde automatique
    function handleContentChange() {
        contentChanged = true;
        extractTitleFromContent();

        if (autoSaveEnabled) {
            if (saveTimeout) clearTimeout(saveTimeout);
            saveTimeout = setTimeout(saveNote, 2000);
        }
    }

    function handleTitleChange() {
        titleChanged = true;

        if (autoSaveEnabled) {
            if (saveTimeout) clearTimeout(saveTimeout);
            saveTimeout = setTimeout(saveNote, 2000);
        }
    }

    function goToDashboard() {
        goto('/app/dashboard');
    }

    function toggleViewMode() {
        // Cycle entre les modes: edit -> preview -> split -> edit
        if (viewMode === 'edit') {
            viewMode = 'preview';
        } else if (viewMode === 'preview') {
            viewMode = 'split';
        } else {
            viewMode = 'edit';
        }
    }

</script>

<div class="container mx-auto px-4 py-4 max-w-6xl">
    <header class="flex justify-between items-center mb-6">
        <div class="flex items-center">
            <button
                    on:click={goToDashboard}
                    class="mr-4 text-gray-600 hover:text-gray-900"
                    aria-label="Retourner au tableau de bord"
            >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
            </button>
            <h1 class="text-2xl font-bold text-black dark:text-gray-300">
                {$page.params.id === 'new' ? 'Nouvelle note' : 'Éditer la note'}
            </h1>
        </div>

        <div class="flex items-center space-x-4">
            <label class="flex items-center cursor-pointer">
                <input
                        type="checkbox"
                        bind:checked={autoSaveEnabled}
                        class="form-checkbox h-5 w-5 text-blue-600"
                >
                <span class="ml-2 text-sm text-black dark:text-gray-300">Auto-save</span>
            </label>

            <button
                    on:click={toggleViewMode}
                    class="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
                {viewMode === 'edit' ? 'Aperçu' : viewMode === 'preview' ? 'Split' : 'Édition'}
            </button>


            <button
                    on:click={saveNote}
                    disabled={saving || (!titleChanged && !contentChanged)}
                    class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
                {#if saving}
                    <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                {/if}
                Enregistrer
            </button>
        </div>
    </header>

    {#if savedMessage}
        <div
                transition:fly={{ y: -20, duration: 300 }}
                class="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded"
        >
            {savedMessage}
        </div>
    {/if}

    {#if error}
        <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded">
            <p>{error}</p>
            <button class="mt-2 text-blue-600 hover:underline" on:click={() => error = null}>
                Fermer
            </button>
        </div>
    {/if}

    {#if loading}
        <div class="flex justify-center items-center h-64">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    {:else}
        <div class="bg-white shadow-md rounded-lg overflow-hidden dark:bg-gray-800 dark:text-white">
            <div class="p-4 border-b dark:border-gray-700">
                <input
                        type="text"
                        bind:value={note.title}
                        on:input={handleTitleChange}
                        placeholder="Titre de la note"
                        class="w-full text-xl font-medium focus:outline-none dark:bg-gray-800 dark:text-white"
                />
            </div>

            <div class={`flex h-[600px] ${viewMode === 'split' ? 'split-view' : ''}`}>
                {#if viewMode === 'edit' || viewMode === 'split'}
                    <div class={`p-4 ${viewMode === 'split' ? 'w-1/2 border-r dark:border-gray-700' : 'w-full'} h-full`}>
        <textarea
                bind:value={note.content}
                on:input={handleContentChange}
                placeholder="Contenu en AsciiDoc... (commencez par '= Titre' pour un titre principal)"
                class="w-full h-full font-mono text-sm focus:outline-none resize-none p-2 dark:bg-gray-700 dark:text-white rounded-md"
        ></textarea>
                    </div>
                {/if}

                {#if viewMode === 'preview' || viewMode === 'split'}
                    <div class={`p-6 ${viewMode === 'split' ? 'w-1/2' : 'w-full'} h-full overflow-auto`}>
                        <AsciiDocViewer content={note.content} />
                    </div>
                {/if}
            </div>


            <div class="bg-gray-50 px-4 py-3 flex justify-between items-center text-sm text-gray-500 dark:bg-gray-700 dark:text-gray-300">
                <div>
                    <span class="mr-4">ID: {note.id}</span>
                    <span>Status:
            <span class={`inline-flex px-2 text-xs font-semibold rounded-full
              ${note.syncStatus === 'synced' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                note.syncStatus === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
              {note.syncStatus === 'synced' ? 'Synchronisé' :
                  note.syncStatus === 'pending' ? 'En attente' : 'Non synchronisé'}
            </span>
          </span>
                </div>
                <div>
                    <span>Mis à jour: {new Date(note.updatedAt).toLocaleString()}</span>
                </div>
            </div>
        </div>

        <div class="mt-6">
            <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Aide AsciiDoc</h3>
            <div class="bg-white shadow overflow-hidden rounded-lg divide-y divide-gray-200 text-sm dark:bg-gray-800 dark:divide-gray-700">
                <div class="px-4 py-2 flex">
                    <div class="w-1/3 font-medium">= Titre</div>
                    <div class="w-2/3">Titre principal (H1)</div>
                </div>
                <div class="px-4 py-2 flex">
                    <div class="w-1/3 font-medium">== Sous-titre</div>
                    <div class="w-2/3">Sous-titre (H2)</div>
                </div>
                <div class="px-4 py-2 flex">
                    <div class="w-1/3 font-medium">*texte*</div>
                    <div class="w-2/3">Texte en gras</div>
                </div>
                <div class="px-4 py-2 flex">
                    <div class="w-1/3 font-medium">_texte_</div>
                    <div class="w-2/3">Texte en italique</div>
                </div>
                <div class="px-4 py-2 flex">
                    <div class="w-1/3 font-medium">* Item</div>
                    <div class="w-2/3">Liste à puces</div>
                </div>
                <div class="px-4 py-2 flex">
                    <div class="w-1/3 font-medium">. Item</div>
                    <div class="w-2/3">Liste numérotée</div>
                </div>
                <div class="px-4 py-2 flex">
                    <div class="w-1/3 font-medium">[source,javascript]<br>----<br>code<br>----</div>
                    <div class="w-2/3">Bloc de code</div>
                </div>
                <div class="px-4 py-2 flex">
                    <div class="w-1/3 font-medium">link:https://asciidoc.org[AsciiDoc]</div>
                    <div class="w-2/3">Lien hypertexte</div>
                </div>
                <div class="px-4 py-2 flex">
                    <div class="w-1/3 font-medium">image::chemin/image.png[]</div>
                    <div class="w-2/3">Intégration d'image</div>
                </div>
            </div>
        </div>
    {/if}
</div>