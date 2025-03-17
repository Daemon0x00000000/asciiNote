<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';
    import { fade, scale } from 'svelte/transition';
    import { cubicOut } from 'svelte/easing';

    // Props pour la personnalisation
    export let primaryText = "Commencer maintenant";
    export let secondaryText = "En savoir plus";
    export let primaryHref = "/app";
    export let secondaryHref = "#features";
    export let size = "md";  // "sm", "md", "lg"
    export let withAnimation = true;
    export let fullWidth = false;
    export let primaryColor = "red";  // "red", "blue", "green", "purple"
    export let alignment = "center";  // "left", "center", "right"
    export let secondaryButtonStyle = "outline"; // "outline", "ghost"
    export let className = "";

    // État interne pour les animations
    let ctaReady = false;

    // Classes calculées en fonction des props
    $: sizeClasses = {
        sm: "px-4 py-2 text-sm",
        md: "px-6 py-3 text-base",
        lg: "px-8 py-4 text-lg",
    }[size];

    $: colorClasses = {
        red: {
            gradient: "from-red-600 via-red-400 to-red-600",
            button: "from-red-600 to-red-700 hover:from-red-500 hover:to-red-600",
            shadow: "hover:shadow-red-500/30"
        },
        blue: {
            gradient: "from-blue-600 via-blue-400 to-blue-600",
            button: "from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600",
            shadow: "hover:shadow-blue-500/30"
        },
        green: {
            gradient: "from-emerald-600 via-emerald-400 to-emerald-600",
            button: "from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600",
            shadow: "hover:shadow-emerald-500/30"
        },
        purple: {
            gradient: "from-purple-600 via-purple-400 to-purple-600",
            button: "from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600",
            shadow: "hover:shadow-purple-500/30"
        }
    }[primaryColor];

    $: alignmentClasses = {
        left: "justify-start",
        center: "justify-center",
        right: "justify-end"
    }[alignment];

    $: secondaryStyles = {
        outline: "border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500",
        ghost: "border-transparent hover:bg-gray-100 dark:hover:bg-gray-800"
    }[secondaryButtonStyle];

    // Pour toute manipulation DOM, assurez-vous qu'elle est exécutée uniquement côté client
    onMount(() => {
        if (withAnimation) {
            // Activation des animations après le montage du composant
            setTimeout(() => {
                ctaReady = true;
            }, 200);
        } else {
            ctaReady = true;
        }
    });
</script>

<div class="flex flex-col sm:flex-row {alignmentClasses} items-center gap-4 {className}"
     class:w-full={fullWidth}>

    <!-- CTA -->
    <div class="relative group {fullWidth ? 'w-full' : 'sm:w-auto'} {fullWidth ? '' : 'max-w-xs'}">
        <!-- Bordure dégradée -->
        <div class="absolute -inset-0.5 bg-gradient-to-r {colorClasses?.gradient} rounded-lg
                    opacity-75 group-hover:opacity-100 transition-all duration-300
                    animate-gradient-x"></div>

        <!-- Bouton principal -->
        <a href={primaryHref}
           class="relative flex justify-center items-center {sizeClasses} {fullWidth ? 'w-full' : 'sm:w-auto'} bg-gradient-to-br
                  {colorClasses?.button} text-white rounded-lg font-medium shadow-md
                  transition-all duration-300 {colorClasses?.shadow} hover:shadow-lg">

            <!-- Texte avec animation subtile -->
            {#if browser && ctaReady && withAnimation}
                <span in:scale={{ start: 0.95, duration: 400, delay: 100, easing: cubicOut }}
                      class="relative z-10 font-semibold tracking-wide">
                    {primaryText}
                </span>
            {:else}
                <span class="relative z-10 font-semibold tracking-wide">
                    {primaryText}
                </span>
            {/if}
        </a>
    </div>

    <!-- Bouton secondaire -->
    {#if secondaryText}
        <a href={secondaryHref}
           class="{fullWidth ? 'w-full' : 'sm:w-auto'} {sizeClasses} {secondaryStyles} rounded-lg
                  font-medium transition-all duration-300 hover:shadow-md
                  flex justify-center items-center">
            {#if browser && ctaReady && withAnimation}
                <span in:fade={{ duration: 300, delay: 300 }}>
                    {secondaryText}
                </span>
            {:else}
                <span>
                    {secondaryText}
                </span>
            {/if}
        </a>
    {/if}
</div>

<style>
    @keyframes gradient-x {
        0%, 100% {
            background-position: 0% 50%;
        }
        50% {
            background-position: 100% 50%;
        }
    }

    .animate-gradient-x {
        animation: gradient-x 3s ease infinite;
        background-size: 200% 200%;
    }

    /* Effet de lumière sur la bordure au hover */
    .group:hover .animate-gradient-x {
        background-size: 150% 150%;
        animation: gradient-x 2s ease infinite;
    }
</style>