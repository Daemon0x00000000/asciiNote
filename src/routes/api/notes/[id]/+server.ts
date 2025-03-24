import { json } from '@sveltejs/kit';
import { connectToDatabase } from '$lib/server/db/mongo';
import NoteModel from '$lib/server/db/models/note';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
    try {
        await connectToDatabase();
        const note = await NoteModel.findOne({ id: params.id });

        if (!note) {
            return json({ error: 'Note non trouvée' }, { status: 404 });
        }

        return json(note);
    } catch (error) {
        console.error('Erreur lors de la récupération de la note:', error);
        return json({ error: 'Erreur serveur' }, { status: 500 });
    }
};

export const PUT: RequestHandler = async ({ request, params }) => {
    try {
        await connectToDatabase();
        const updates = await request.json();

        // Rechercher d'abord la note
        let note = await NoteModel.findOne({ id: params.id });

        // Si la note n'existe pas, la créer
        if (!note) {
            console.log(`Note ${params.id} non trouvée, création d'une nouvelle note`);
            note = new NoteModel({
                id: params.id,
                title: updates.title || 'Nouvelle note',
                content: updates.content || '',
                createdAt: new Date(),
                updatedAt: new Date(),
                syncStatus: 'synced',
                lastSynced: new Date(),
                ...updates
            });

            await note.save();
            return json(note);
        }

        // Sinon, mettre à jour la note existante
        const updatedNote = await NoteModel.findOneAndUpdate(
            { id: params.id },
            {
                ...updates,
                updatedAt: new Date(),
                syncStatus: 'synced',
                lastSynced: new Date()
            },
            { new: true }
        );

        return json(updatedNote);
    } catch (error) {
        console.error('Erreur lors de la mise à jour ou création de la note:', error);
        return json({ error: 'Erreur serveur' }, { status: 500 });
    }
};

export const DELETE: RequestHandler = async ({ params }) => {
    try {
        await connectToDatabase();
        const result = await NoteModel.deleteOne({ id: params.id });

        if (result.deletedCount === 0) {
            return json({ error: 'Note non trouvée' }, { status: 404 });
        }

        return json({ success: true });
    } catch (error) {
        console.error('Erreur lors de la suppression de la note:', error);
        return json({ error: 'Erreur serveur' }, { status: 500 });
    }
};