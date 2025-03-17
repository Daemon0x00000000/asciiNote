<script lang="ts">
    import '../app.css';
    import { onMount } from 'svelte';
    onMount(async () => {
        const { registerServiceWorker } = await import('$lib/registerServiceWorker.js');
        registerServiceWorker();
    })
    let { children } = $props();
</script>

{@render children()}