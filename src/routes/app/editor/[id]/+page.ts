import { error } from '@sveltejs/kit';
import type { PageLoad } from '../../../../../.svelte-kit/types/src/routes';

export const load: PageLoad = async ({ params, fetch }) => {
    // Si c'est une nouvelle note, pas besoin de charger quoi que ce soit
    if (params.id === 'new') {
        return {
            noteId: 'new'
        };
    }

    try {
        const response = await fetch(`/api/notes/${params.id}`);

        if (response.status === 404) {
            // Si la note n'existe pas, on retourne simplement l'ID pour créer une nouvelle
            return {
                noteId: params.id
            };
        }

        if (!response.ok) {
            throw error(response.status, 'Impossible de charger la note');
        }

        const note = await response.json();

        return {
            note,
            noteId: params.id
        };
    } catch (err) {
        console.error('Erreur lors du chargement de la note:', err);
        throw error(500, 'Erreur lors du chargement de la note');
    }
};