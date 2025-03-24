import mongoose from 'mongoose';
import type { Note } from '$lib/common/types';

const NoteSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    tags: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    syncStatus: {
        type: String,
        enum: ['pending', 'synced', 'error'],
        default: 'synced'
    },
    lastSynced: { type: Date }
});

// Vérifier si le modèle existe déjà pour éviter l'erreur "Cannot overwrite model once compiled"
export default mongoose.models.Note || mongoose.model<Note>('Note', NoteSchema);