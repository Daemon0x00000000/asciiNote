import { type Note } from "$lib/common/types.js";

const API_URL = '/api/notes';

export class NoteApiService {
    async fetchNotes(): Promise<Note[] | { offline: boolean, message: string }> {
        try {
            const response = await fetch(`${API_URL}`);

            if (!response.ok) {
                throw new Error(`Erreur: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error("Erreur lors de la récupération des notes:", error);

            // En cas d'erreur réseau, retourner un indicateur de mode hors ligne
            return {
                offline: true,
                message: 'Serveur inaccessible - Mode hors ligne activé'
            };
        }
    }

    async saveNote(note: Note): Promise<Note> {
        const method = note.id ? 'PUT' : 'POST';
        const url = note.id ? `${API_URL}/${note.id}` : API_URL;

        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(note),
        });

        if (!response.ok) {
            throw new Error(`Erreur: ${response.statusText}`);
        }

        return await response.json();
    }

    async deleteNote(noteId: string): Promise<boolean> {
        const response = await fetch(`${API_URL}/${noteId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error(`Erreur lors de la suppression: ${response.statusText}`);
        }

        return true;
    }
}
// Singleton API
export const noteApi = new NoteApiService();