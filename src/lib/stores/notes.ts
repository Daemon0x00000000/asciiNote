import { getContext, setContext } from 'svelte';
import { writable, derived, get } from 'svelte/store';
import type { Note } from "$lib/common/types.js";
import { noteDB } from "$lib/services/db.js";
import { NoteApiService } from "$lib/services/api.js";
import { networkStatus, initNetworkListeners } from "$lib/stores/networkStatus.js";
import {browser} from "$app/environment";

// Clé unique pour le contexte
const NOTE_STORE_KEY = Symbol('noteStore');

type NoteState = {
    notes: Note[];
    isLoading: boolean;
    error: string | null;
    lastSync: Date | null;
    syncStatus: 'idle' | 'syncing' | 'complete' | 'error';
    pendingCount: number;
    isOffline: boolean;
};

export function createNoteStore() {
    // État initial du store
    const state = writable<NoteState>({
        notes: [],
        isLoading: false,
        error: null,
        lastSync: null,
        syncStatus: 'idle',
        pendingCount: 0,
        isOffline: false
    });

    // Instance du service API
    const apiService = new NoteApiService();

    // Canal de communication avec le service worker
    let syncChannel: BroadcastChannel | null = null;

    // Initialiser le canal de synchronisation
    function initSyncChannel() {
        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
            syncChannel = new BroadcastChannel('sync-channel');

            syncChannel.onmessage = (event) => {
                const { type, entityId, operation, error } = event.data;

                switch (type) {
                    case 'sync-start':
                        state.update(s => ({ ...s, syncStatus: 'syncing' }));
                        break;

                    case 'sync-success':
                        if (operation === 'save' && entityId) {
                            // Une note a été synchronisée avec succès
                            state.update(s => {
                                const updatedNotes = s.notes.map(note =>
                                    note.id === entityId
                                        ? { ...note, syncStatus: 'synced', lastSynced: new Date() }
                                        : note
                                );
                                return { ...s, notes: updatedNotes };
                            });
                        }
                        break;

                    case 'sync-error':
                        state.update(s => ({
                            ...s,
                            syncStatus: 'error',
                            error,
                            isOffline: true  // Passer en mode hors ligne
                        }));
                        break;

                    case 'api-offline':
                        state.update(s => ({
                            ...s,
                            isOffline: true,
                            error: error || 'Mode hors ligne activé'
                        }));
                        break;

                    case 'connection-online':
                        state.update(s => ({ ...s, isOffline: false }));
                        // Lancer une synchronisation automatique
                        syncPendingNotes();
                        break;

                    case 'connection-offline':
                        state.update(s => ({ ...s, isOffline: true }));
                        break;

                    case 'trigger-sync':
                        // Déclencher une synchronisation immédiate
                        syncPendingNotes();
                        break;


                    case 'sync-complete':
                        state.update(s => ({
                            ...s,
                            syncStatus: 'complete',
                            lastSync: new Date(),
                            isOffline: false,
                            error: null
                        }));
                        // Recharger les notes pour avoir les dernières versions synchronisées
                        loadNotes(false);
                        break;
                }
            };
        }
    }

    // Obtenir toutes les notes (locales et/ou du serveur)
    async function loadNotes(forceSync = false): Promise<Note[]> {
        state.update(s => ({ ...s, isLoading: true, error: null }));

        try {
            // Toujours initialiser la BD locale d'abord
            await noteDB.init();

            // Charger les notes depuis la base de données locale
            const localNotes = await noteDB.getAllNotes();

            // Mise à jour immédiate avec les données locales
            state.update(s => ({ ...s, notes: localNotes }));

            // Compter les notes en attente de synchronisation
            const pendingCount = localNotes.filter(note =>
                note.syncStatus === 'pending' || note.syncStatus === 'error'
            ).length;

            state.update(s => ({ ...s, pendingCount }));

            // Synchroniser avec le serveur si demandé et connecté
            if (forceSync && navigator.onLine) {
                await syncWithServer();
            } else if (navigator.onLine && pendingCount > 0) {
                // Synchroniser automatiquement les notes en attente si connecté
                syncPendingNotes();
            }

            state.update(s => ({ ...s, isLoading: false }));
            return get(state).notes;
        } catch (error) {
            console.error('Erreur lors du chargement des notes:', error);
            state.update(s => ({
                ...s,
                isLoading: false,
                error: error instanceof Error ? error.message : 'Erreur inconnue',
                isOffline: !navigator.onLine
            }));
            return get(state).notes;
        }
    }

    // Synchroniser avec le serveur
    async function syncWithServer() {
        if (!navigator.onLine) {
            state.update(s => ({ ...s, isOffline: true }));
            return;
        }

        state.update(s => ({ ...s, syncStatus: 'syncing' }));

        try {
            // Récupérer les notes du serveur
            const serverNotes = await apiService.fetchNotes();

            // Fusionner avec les notes locales
            await noteDB.mergeNotes(serverNotes);

            // Récupérer les notes fusionnées
            const mergedNotes = await noteDB.getAllNotes();

            state.update(s => ({
                ...s,
                notes: mergedNotes,
                lastSync: new Date(),
                syncStatus: 'complete',
                isOffline: false,
                error: null
            }));
        } catch (error) {
            console.error('Erreur lors de la synchronisation avec le serveur:', error);
            state.update(s => ({
                ...s,
                syncStatus: 'error',
                error: error instanceof Error ? error.message : 'Erreur de synchronisation',
                isOffline: !navigator.onLine
            }));
        }
    }

    // Synchroniser les notes en attente
    async function syncPendingNotes() {
        // Ne rien faire si nous sommes hors ligne
        if (get(networkStatus).isOnline === false) {
            return;
        }

        state.update(s => ({ ...s, syncStatus: 'syncing' }));

        try {
            // Récupérer toutes les notes avec statut 'pending'
            const pendingNotes = get(state).notes.filter(note => note.syncStatus === 'pending');

            if (pendingNotes.length === 0) {
                state.update(s => ({ ...s, syncStatus: 'idle' }));
                return;
            }

            // Synchroniser chaque note
            for (const note of pendingNotes) {
                try {
                    await apiService.saveNote(note);
                    // Mettre à jour le statut dans le store
                    state.update(s => ({
                        ...s,
                        notes: s.notes.map(n =>
                            n.id === note.id
                                ? { ...n, syncStatus: 'synced', lastSynced: new Date() }
                                : n
                        )
                    }));
                } catch (error) {
                    console.error(`Erreur lors de la synchronisation de la note ${note.id}:`, error);
                }
            }

            // Mettre à jour le compteur de notes en attente
            state.update(s => ({
                ...s,
                syncStatus: 'complete',
                lastSync: new Date(),
                pendingCount: s.notes.filter(note => note.syncStatus === 'pending').length
            }));

        } catch (error) {
            console.error("Erreur lors de la synchronisation des notes en attente:", error);
            state.update(s => ({ ...s, syncStatus: 'error', error: String(error) }));
        }
    }

    // Créer une nouvelle note
    async function createNote(noteData: Partial<Note>): Promise<Note> {
        console.log('création de la note', noteData);
        const newNote: Note = {
            id: crypto.randomUUID(),
            title: noteData.title || 'Nouvelle note',
            content: noteData.content || '',
            format: noteData.format || 'asciidoc',
            createdAt: new Date(),
            updatedAt: new Date(),
            syncStatus: navigator.onLine ? 'synced' : 'pending'
        };

        // Sauvegarder localement d'abord
        await noteDB.addNote(newNote);

        // Mettre à jour le store
        state.update(s => {
            const notes = [...s.notes, newNote];
            return {
                ...s,
                notes,
                pendingCount: s.pendingCount + (newNote.syncStatus === 'pending' ? 1 : 0)
            };
        });

        // Synchroniser avec le serveur si possible
        if (navigator.onLine) {
            try {
                const savedNote = await apiService.saveNote(newNote);
                await noteDB.addNote({ ...savedNote, syncStatus: 'synced' });

                state.update(s => {
                    const notes = s.notes.map(n =>
                        n.id === savedNote.id ? { ...savedNote, syncStatus: 'synced' } : n
                    );
                    return {
                        ...s,
                        notes,
                        pendingCount: s.pendingCount - (newNote.syncStatus === 'pending' ? 1 : 0)
                    };
                });

                return savedNote;
            } catch (error) {
                console.error('Erreur lors de la création de la note sur le serveur:', error);

                // Marquer pour synchronisation ultérieure
                if ('serviceWorker' in navigator && 'SyncManager' in window) {
                    const registration = await navigator.serviceWorker.ready;
                    await registration.sync.register('notes-sync');
                }
            }
        }

        return newNote;
    }



    // Sauvegarder une note
    async function saveNote(note: Note): Promise<Note> {
        const updatedNote = {
            ...note,
            updatedAt: new Date(),
            syncStatus: navigator.onLine ? 'synced' : 'pending'
        };

        // Sauvegarder localement d'abord
        await noteDB.addNote(updatedNote);

        // Mettre à jour le store
        state.update(s => {
            const wasPending = s.notes.find(n => n.id === note.id)?.syncStatus === 'pending';
            const isPending = updatedNote.syncStatus === 'pending';

            const pendingDelta = isPending && !wasPending ? 1 :
                (!isPending && wasPending ? -1 : 0);

            const notes = s.notes.map(n =>
                n.id === updatedNote.id ? updatedNote : n
            );

            return {
                ...s,
                notes,
                pendingCount: s.pendingCount + pendingDelta
            };
        });

        // Synchroniser avec le serveur si possible
        if (navigator.onLine) {
            try {
                const savedNote = await apiService.saveNote(updatedNote);
                await noteDB.addNote({ ...savedNote, syncStatus: 'synced' });

                state.update(s => {
                    const notes = s.notes.map(n =>
                        n.id === savedNote.id ? { ...savedNote, syncStatus: 'synced' } : n
                    );
                    return {
                        ...s,
                        notes,
                        pendingCount: Math.max(0, s.pendingCount - 1)
                    };
                });

                return savedNote;
            } catch (error) {
                console.error('Erreur lors de la sauvegarde de la note sur le serveur:', error);

                // Marquer pour synchronisation ultérieure
                if ('serviceWorker' in navigator && 'SyncManager' in window) {
                    const registration = await navigator.serviceWorker.ready;
                    await registration.sync.register('notes-sync');
                }
            }
        }

        return updatedNote;
    }

    // Supprimer une note
    async function deleteNote(noteId: string): Promise<boolean> {
        // Supprimer localement d'abord
        await noteDB.deleteNote(noteId);

        // Mettre à jour le store
        state.update(s => {
            const noteToDelete = s.notes.find(n => n.id === noteId);
            const wasCount = noteToDelete?.syncStatus === 'pending' ? 1 : 0;

            const notes = s.notes.filter(n => n.id !== noteId);
            return {
                ...s,
                notes,
                pendingCount: Math.max(0, s.pendingCount - wasCount)
            };
        });

        // Synchroniser avec le serveur si possible
        if (navigator.onLine) {
            try {
                await apiService.deleteNote(noteId);
                return true;
            } catch (error) {
                console.error('Erreur lors de la suppression de la note sur le serveur:', error);

                // await noteDB.markForDeletion(noteId);

                // Demander au service worker de synchroniser
                if ('serviceWorker' in navigator && 'SyncManager' in window) {
                    const registration = await navigator.serviceWorker.ready;
                    await registration.sync.register('notes-sync');
                }
            }
        } else {
            // Marquer pour suppression ultérieure
            // await noteDB.markForDeletion(noteId);
        }

        return true;
    }

    // Initialisation
    function initialize() {
        // Initialiser la surveillance du réseau
        initNetworkListeners();

        // S'abonner aux changements de statut du réseau
        const unsubscribe = networkStatus.subscribe(status => {
            if (status.isOnline && status.wasOffline) {
                // Si nous venons juste de passer de hors ligne à en ligne
                syncPendingNotes();
            }
        });

        // Initialiser le canal de synchronisation
        if (browser) {
            initSyncChannel();

            // Vérifier s'il y a des notes en attente au démarrage
            loadNotes().then(() => {
                const currentState = get(state);
                if (currentState.pendingCount > 0 && navigator.onLine) {
                    syncPendingNotes();
                }
            });
        }

        return {
            destroy() {
                if (syncChannel) {
                    syncChannel.close();
                }
                unsubscribe();
            }
        };
    }

    if (browser) {
        // S'abonner aux changements de connectivité
        networkStatus.subscribe((status) => {
            // Si nous venons de récupérer la connexion
            if (status.isOnline && status.wasOffline) {
                console.log("Connexion internet rétablie, synchronisation automatique...");
                syncNotes();
            }
        });
    }

    // Fonction de synchronisation
    async function syncNotes() {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            try {
                const registration = await navigator.serviceWorker.ready;
                await registration.sync.register('notes-sync');
                // Charger également les notes depuis le serveur
                await loadNotes(true);
            } catch (error) {
                console.error("Erreur pendant la synchronisation automatique:", error);
            }
        }
    }


    // API publique du store
    const noteStore = {
        subscribe: state.subscribe,
        loadNotes,
        createNote,
        saveNote,
        deleteNote,
        syncPendingNotes,
        syncWithServer,
        initialize,
        syncNotes,

        // Dérivé pour obtenir les notes en attente
        pendingNotes: derived(state, ($state) =>
            $state.notes.filter(note =>
                note.syncStatus === 'pending' || note.syncStatus === 'error'
            )
        ),

        // Dérivé pour obtenir le statut de synchronisation
        syncInfo: derived(state, ($state) => ({
            status: $state.syncStatus,
            lastSync: $state.lastSync,
            pendingCount: $state.pendingCount,
            isOffline: $state.isOffline,
            error: $state.error
        }))
    };

    return noteStore;
}

// Récupérer le store de notes du contexte ou le créer
export function getNoteStore() {
    const store = getContext(NOTE_STORE_KEY);
    if (!store) {
        return setNoteStore();

    }
    return store;
}


// Initialiser le store de notes dans le contexte
export function setNoteStore(callback?: (store: ReturnType<typeof createNoteStore>) => void) {
    const existingStore = getContext<ReturnType<typeof createNoteStore> | undefined>(NOTE_STORE_KEY);

    if (existingStore) {
        // Le store existe déjà, appeler le callback si fourni
        if (callback) callback(existingStore);
        return existingStore;
    }

    // Créer et initialiser le store
    const noteStore = createNoteStore();
    setContext(NOTE_STORE_KEY, noteStore);

    // Initialiser le store
    noteStore.initialize();

    // Appeler le callback si fourni
    if (callback) callback(noteStore);

    return noteStore;
}