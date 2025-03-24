<script lang="ts">
    import { onMount } from 'svelte';
    import { theme} from "$lib/stores/theme.js";
    import { browser } from '$app/environment';

    if (browser) {
        const currentTheme = $theme;
        if (currentTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }


    onMount(() => {
        if (browser) {
            // Appliquer le thème initial
            document.documentElement.setAttribute('data-theme', $theme);

            if ($theme === 'dark') {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        }
    });

    // Réagir aux changements de thème
    $: if (browser && $theme) {
        document.documentElement.setAttribute('data-theme', $theme);

        if ($theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }


</script>
