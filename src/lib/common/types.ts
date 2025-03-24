export interface Note {
    id?: string;
    title: string;
    content: string;
    tags?: string[];
    createdAt?: Date;
    updatedAt?: Date;
    syncStatus?: 'pending' | 'synced' | 'error';
    lastSynced?: Date;
}

export interface SyncOperation {
    id?: number;
    operation: 'save' | 'delete';
    entityType: string;
    entityId: string;
    timestamp: Date;
    retryCount?: number;
}