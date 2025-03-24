import mongoose from 'mongoose';
import { MONGODB_URI } from '$env/static/private';

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
    if (cached.conn) {
        return cached.conn;
    }

    if (!MONGODB_URI) {
        console.error('MONGODB_URI n\'est pas défini!');
        throw new Error('MONGODB_URI n\'est pas défini!');
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
        };

        console.log('Tentative de connexion à MongoDB...');
        cached.promise = mongoose.connect(MONGODB_URI, opts)
            .then((mongoose) => {
                console.log('Connexion MongoDB établie avec succès');
                return mongoose;
            })
            .catch((error) => {
                console.error('Erreur de connexion à MongoDB:', error);
                throw error;
            });
    }
    cached.conn = await cached.promise;
    return cached.conn;
}