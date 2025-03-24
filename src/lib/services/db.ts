import { type Note, type SyncOperation } from "$lib/common/types.js";

export class NoteDatabase {
	private db: IDBDatabase | null = null;
	private dbName = 'asciiNoteDB';
	private dbVersion = 1;

	async init(): Promise<void> {
		if (this.db) return;

		return new Promise((resolve, reject) => {
			const request = indexedDB.open(this.dbName, this.dbVersion);

			request.onupgradeneeded = (event) => {
				const db = (event.target as IDBOpenDBRequest).result;

				// Store pour les notes
				if (!db.objectStoreNames.contains('notes')) {
					const notesStore = db.createObjectStore('notes', { keyPath: 'id' });
					notesStore.createIndex('syncStatus', 'syncStatus', { unique: false });
					notesStore.createIndex('updatedAt', 'updatedAt', { unique: false });
					notesStore.createIndex('title', 'title', { unique: false });
				}

				// Store pour les opérations de synchronisation
				if (!db.objectStoreNames.contains('syncOperations')) {
					const syncStore = db.createObjectStore('syncOperations', {
						keyPath: 'id',
						autoIncrement: true
					});
					syncStore.createIndex('entityId', 'entityId', { unique: false });
					syncStore.createIndex('timestamp', 'timestamp', { unique: false });
				}
			};

			request.onsuccess = () => {
				this.db = request.result;
				resolve();
			};

			request.onerror = () => {
				console.error("Erreur d'ouverture de la base de données:", request.error);
				reject(request.error);
			};
		});
	}

	async addNote(note: Note): Promise<string> {
		await this.init();

		// Générer un ID si non fourni
		if (!note.id) {
			note.id = crypto.randomUUID();
		}

		// Mettre à jour les timestamps
		const now = new Date();
		if (!note.createdAt) {
			note.createdAt = now;
		}
		note.updatedAt = now;
		note.syncStatus = 'pending';

		return new Promise((resolve, reject) => {
			const transaction = this.db!.transaction('notes', 'readwrite');
			const store = transaction.objectStore('notes');

			const request = store.put(note);

			request.onsuccess = () => {
				this.addSyncOperation({
					operation: 'save',
					entityType: 'note',
					entityId: note.id!,
					timestamp: now,
					retryCount: 0
				});
				resolve(note.id!);
			};

			request.onerror = () => {
				console.error("Erreur lors de l'ajout de la note:", request.error);
				reject(request.error);
			};
		});
	}

	async updateNote(note: Note): Promise<void> {
		if (!note.id) {
			throw new Error('Impossible de mettre à jour une note sans ID');
		}

		await this.init();

		return new Promise(async (resolve, reject) => {
			// D'abord, récupérer la note existante pour préserver les champs non modifiés
			try {
				const existingNote = await this.getNote(note.id);
				if (!existingNote) {
					reject(new Error('Note non trouvée'));
					return;
				}

				// Fusionner les données
				const updatedNote = {
					...existingNote,
					...note,
					updatedAt: new Date()
				};

				// Conserver le statut de synchronisation si déjà défini
				if (!note.syncStatus) {
					updatedNote.syncStatus = existingNote.syncStatus || 'pending';
				}

				const transaction = this.db!.transaction('notes', 'readwrite');
				const store = transaction.objectStore('notes');
				const request = store.put(updatedNote);

				request.onsuccess = () => {
					// Ajouter une opération de synchronisation seulement si nécessaire
					if (updatedNote.syncStatus === 'pending') {
						this.addSyncOperation({
							operation: 'save',
							entityType: 'note',
							entityId: updatedNote.id!,
							timestamp: new Date(),
							retryCount: 0
						});
					}
					resolve();
				};

				request.onerror = () => {
					console.error('Erreur lors de la mise à jour de la note:', request.error);
					reject(request.error);
				};
			} catch (error) {
				reject(error);
			}
		});
	}

	async getNote(id: string): Promise<Note | null> {
		await this.init();

		return new Promise((resolve, reject) => {
			const transaction = this.db!.transaction('notes', 'readonly');
			const store = transaction.objectStore('notes');
			const request = store.get(id);

			request.onsuccess = () => {
				resolve(request.result || null);
			};

			request.onerror = () => {
				console.error('Erreur lors de la récupération de la note:', request.error);
				reject(request.error);
			};
		});
	}

	async getAllNotes(): Promise<Note[]> {
		await this.init();

		return new Promise((resolve, reject) => {
			const transaction = this.db!.transaction('notes', 'readonly');
			const store = transaction.objectStore('notes');
			const request = store.getAll();

			request.onsuccess = () => {
				resolve(request.result);
			};

			request.onerror = () => {
				console.error('Erreur lors de la récupération des notes:', request.error);
				reject(request.error);
			};
		});
	}

	async getNotesBySyncStatus(syncStatus: 'pending' | 'synced' | 'error'): Promise<Note[]> {
		await this.init();

		return new Promise((resolve, reject) => {
			const transaction = this.db!.transaction('notes', 'readonly');
			const store = transaction.objectStore('notes');
			const index = store.index('syncStatus');
			const request = index.getAll(syncStatus);

			request.onsuccess = () => {
				resolve(request.result);
			};

			request.onerror = () => {
				console.error('Erreur lors de la récupération des notes par statut:', request.error);
				reject(request.error);
			};
		});
	}

	async markNoteSynced(id: string): Promise<void> {
		await this.init();

		const note = await this.getNote(id);
		if (!note) return;

		note.syncStatus = 'synced';
		note.lastSynced = new Date();

		await this.updateNote(note);
	}

	async deleteNote(id: string): Promise<void> {
		await this.init();

		return new Promise((resolve, reject) => {
			const transaction = this.db!.transaction('notes', 'readwrite');
			const store = transaction.objectStore('notes');
			const request = store.delete(id);

			request.onsuccess = () => {
				this.addSyncOperation({
					operation: 'delete',
					entityType: 'note',
					entityId: id,
					timestamp: new Date(),
					retryCount: 0
				});
				resolve();
			};

			request.onerror = () => {
				console.error('Erreur lors de la suppression de la note:', request.error);
				reject(request.error);
			};
		});
	}

	async addSyncOperation(operation: SyncOperation): Promise<number> {
		await this.init();

		return new Promise((resolve, reject) => {
			const transaction = this.db!.transaction('syncOperations', 'readwrite');
			const store = transaction.objectStore('syncOperations');
			const request = store.add(operation);

			request.onsuccess = () => {
				resolve(request.result as number);
			};

			request.onerror = () => {
				console.error("Erreur lors de l'ajout de l'opération de synchronisation:", request.error);
				reject(request.error);
			};
		});
	}

	async getPendingSyncOperations(): Promise<SyncOperation[]> {
		await this.init();

		return new Promise((resolve, reject) => {
			const transaction = this.db!.transaction('syncOperations', 'readonly');
			const store = transaction.objectStore('syncOperations');
			const request = store.getAll();

			request.onsuccess = () => {
				resolve(request.result);
			};

			request.onerror = () => {
				console.error(
					'Erreur lors de la récupération des opérations de synchronisation:',
					request.error
				);
				reject(request.error);
			};
		});
	}

	/**
	 * Fusionne les notes du serveur avec les notes locales
	 *
	 * @param serverNotes - Notes provenant du serveur à fusionner avec les notes locales
	 * @returns {Promise<Note[]>} - Liste des notes fusionnées
	 */
	async mergeNotes(serverNotes: Note[]): Promise<Note[]> {
		try {
			// Récupérer toutes les notes locales
			const localNotes = await this.getAllNotes();

			// Map pour un accès rapide aux notes locales par ID
			const localNotesMap = new Map(localNotes.map((note) => [note.id, note]));

			// Traiter chaque note du serveur
			for (const serverNote of serverNotes) {
				const localNote = localNotesMap.get(serverNote.id);

				if (!localNote) {
					// Note nouvelle : ajouter avec statut 'synced'
					await this.addNote({
						...serverNote,
						syncStatus: 'synced',
						lastSynced: new Date()
					});
				} else {
					// Comparer les timestamps pour déterminer quelle version garder
					const serverUpdatedAt = new Date(serverNote.updatedAt).getTime();
					const localUpdatedAt = new Date(localNote.updatedAt).getTime();

					if (serverUpdatedAt > localUpdatedAt) {
						// La version du serveur est plus récente
						await this.addNote({
							...serverNote,
							syncStatus: 'synced',
							lastSynced: new Date()
						});
					} else if (localNote.syncStatus === 'pending') {
						// La version locale est en attente de synchronisation
						// Ne pas l'écraser avec la version serveur
						continue;
					}
				}
			}

			// Retourner les notes mises à jour
			return await this.getAllNotes();
		} catch (error) {
			console.error('Erreur lors de la fusion des notes:', error);
			throw new Error('La fusion des notes a échoué');
		}
	}

	async deleteSyncOperation(id: number): Promise<void> {
		await this.init();

		return new Promise((resolve, reject) => {
			const transaction = this.db!.transaction('syncOperations', 'readwrite');
			const store = transaction.objectStore('syncOperations');
			const request = store.delete(id);

			request.onsuccess = () => {
				resolve();
			};

			request.onerror = () => {
				console.error(
					"Erreur lors de la suppression de l'opération de synchronisation:",
					request.error
				);
				reject(request.error);
			};
		});
	}
}

export const noteDB = new NoteDatabase();