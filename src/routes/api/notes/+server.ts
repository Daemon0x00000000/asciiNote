import { json } from '@sveltejs/kit';
import { connectToDatabase } from '$lib/server/db/mongo';
import NoteModel from '$lib/server/db/models/note';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
    try {
        await connectToDatabase();
        const notes = await NoteModel.find().sort({ updatedAt: -1 });
        return json(notes);
    } catch (error) {
        console.error('Erreur lors de la récupération des notes:', error);
        return json({ error: 'Erreur serveur' }, { status: 500 });
    }
};

export const POST: RequestHandler = async ({ request }) => {
    try {
        await connectToDatabase();
        const note = await request.json();

        // Utiliser l'ID généré côté client
        const newNote = new NoteModel({
            ...note,
            syncStatus: 'synced',
            lastSynced: new Date()
        });

        await newNote.save();
        return json(newNote);
    } catch (error) {
        console.error('Erreur lors de la création de la note:', error);
        return json({ error: 'Erreur serveur' }, { status: 500 });
    }
};