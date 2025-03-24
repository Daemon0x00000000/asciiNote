<script lang="ts">
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';

    let asciidoctor;
    let container;

    export let content = '';
    export let options = {
        safe: 'safe',
        attributes: {
            'showtitle': true,
            'icons': 'font',
            'source-highlighter': 'highlightjs',
            'sectanchors': true,
            'stem': true
        }
    };

    let renderedHtml = '';
    let loading = true;
    let error = null;

    // Fonction pour mettre à jour le rendu HTML
    async function renderAsciiDoc() {
        if (!browser) return;

        try {
            loading = true;

            if (!asciidoctor) {
                const Asciidoctor = (await import('asciidoctor')).default;
                asciidoctor = Asciidoctor();
            }

            renderedHtml = asciidoctor.convert(content, options);
            error = null;
        } catch (err) {
            console.error('Erreur lors du rendu AsciiDoc:', err);
            error = err.message || 'Erreur lors du rendu AsciiDoc';
            renderedHtml = '';
        } finally {
            loading = false;
        }
    }

    $: if (browser && content !== undefined) {
        renderAsciiDoc();
    }

    onMount(() => {
        renderAsciiDoc();
    });
</script>

{#if loading}
    <div class="flex justify-center items-center p-4">
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
    </div>
{:else if error}
    <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded dark:bg-red-900 dark:border-red-600 dark:text-red-200">
        <p class="font-bold">Erreur de rendu</p>
        <p>{error}</p>
    </div>
{:else}
    <div
            bind:this={container}
            class="prose prose-lg max-w-none dark:prose-invert asciidoc-content"
    >
        {@html renderedHtml}
    </div>
{/if}

<style>
    :global(.asciidoc-content img) {
        max-width: 100%;
        height: auto;
    }

    /* Style pour le mode édition côte à côte */
    @media (min-width: 768px) {
        :global(.split-view .asciidoc-content) {
            padding-left: 1rem;
        }
    }
</style>