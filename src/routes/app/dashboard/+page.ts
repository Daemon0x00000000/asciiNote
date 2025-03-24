import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
    try {
        const response = await fetch('/api/notes');

        if (!response.ok) {
            throw error(response.status, 'Impossible de charger les notes');
        }

        const notes = await response.json();

        return {
            notes
        };
    } catch (err) {
        console.error('Erreur lors du chargement des notes:', err);
        throw error(500, 'Erreur lors du chargement des notes');
    }
};