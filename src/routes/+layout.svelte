<script lang="ts">
    import '../app.css';
    import { onMount } from 'svelte';
    import ThemeInitializer from "$lib/components/app/ThemeInitializer.svelte";

    onMount(async () => {
        const { registerServiceWorker } = await import('$lib/registerServiceWorker.js');
        registerServiceWorker();

    })
    let { children } = $props();
</script>

<ThemeInitializer />

{@render children()}