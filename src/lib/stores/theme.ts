import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Fonction pour initialiser le thème
function createThemeStore() {
    // Valeur par défaut (préférence du système ou 'light')
    let initialTheme = 'light';

    if (browser) {
        // Vérifier si la préférence est stockée dans localStorage
        const savedTheme = localStorage.getItem('theme');

        if (savedTheme) {
            // Utiliser la préférence sauvegardée
            initialTheme = savedTheme;
        } else {
            // Sinon, utiliser la préférence du système
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            initialTheme = prefersDark ? 'dark' : 'light';
        }
    }

    const { subscribe, set, update } = writable<'dark' | 'light'>(initialTheme as 'dark' | 'light');

    // Fonction pour appliquer le thème avec transition
    function applyThemeWithTransition(newTheme: 'dark' | 'light') {
        if (!browser) return;

        // Ajouter une classe pour la transition
        document.documentElement.classList.add('theme-transitioning');

        // Appliquer le thème
        document.documentElement.setAttribute('data-theme', newTheme);

        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }

        // Supprimer la classe de transition après la fin de l'animation
        setTimeout(() => {
            document.documentElement.classList.remove('theme-transitioning');
        }, 300);
    }

    return {
        subscribe,
        toggleTheme: () => update(theme => {
            const newTheme = theme === 'dark' ? 'light' : 'dark';

            if (browser) {
                // Sauvegarder dans localStorage
                localStorage.setItem('theme', newTheme);

                // Appliquer avec transition
                applyThemeWithTransition(newTheme);
            }

            return newTheme;
        }),

        setTheme: (newTheme: 'dark' | 'light') => {
            set(newTheme);

            if (browser) {
                // Sauvegarder dans localStorage
                localStorage.setItem('theme', newTheme);

                // Appliquer avec transition
                applyThemeWithTransition(newTheme);
            }
        }
    };
}

export const theme = createThemeStore();
