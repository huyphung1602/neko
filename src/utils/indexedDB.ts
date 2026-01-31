// IndexedDB wrapper for card storage
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface CardRecord {
  id: string;
  deckPath: string; // e.g., "/Japanese/Vocabulary"
  filePath: string; // e.g., "/Japanese/Vocabulary/card_id.md"
  content: string; // Full markdown content with frontmatter
  lastModified: number; // Timestamp from file
  syncedAt: number; // When last synced to IndexedDB
}

interface DeckRecord {
  id: string;
  path: string; // e.g., "/Japanese/Vocabulary"
  name: string;
  parentPath: string | null;
  lastModified: number;
}

interface NekoDB extends DBSchema {
  cards: {
    key: string;
    value: CardRecord;
    indexes: {
      'by-deck': string;
      'by-file-path': string;
    };
  };
  decks: {
    key: string;
    value: DeckRecord;
    indexes: {
      'by-path': string;
      'by-parent': string;
    };
  };
  metadata: {
    key: string;
    value: {
      key: string;
      value: unknown;
    };
  };
}

const DB_NAME = 'neko-cards-db';
const DB_VERSION = 1;

class IndexedDBStorage {
  private db: IDBPDatabase<NekoDB> | null = null;

  async init(): Promise<void> {
    if (this.db) return;

    this.db = await openDB<NekoDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Cards store
        if (!db.objectStoreNames.contains('cards')) {
          const cardStore = db.createObjectStore('cards', { keyPath: 'id' });
          cardStore.createIndex('by-deck', 'deckPath');
          cardStore.createIndex('by-file-path', 'filePath');
        }

        // Decks store
        if (!db.objectStoreNames.contains('decks')) {
          const deckStore = db.createObjectStore('decks', { keyPath: 'id' });
          deckStore.createIndex('by-path', 'path');
          deckStore.createIndex('by-parent', 'parentPath');
        }

        // Metadata store
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }
      }
    });
  }

  async getDB(): Promise<IDBPDatabase<NekoDB>> {
    if (!this.db) {
      await this.init();
    }
    return this.db!;
  }

  // Card operations
  async getCard(id: string): Promise<CardRecord | undefined> {
    const db = await this.getDB();
    return db.get('cards', id);
  }

  async getCardByFilePath(filePath: string): Promise<CardRecord | undefined> {
    const db = await this.getDB();
    return db.getFromIndex('cards', 'by-file-path', filePath);
  }

  async getCardsByDeck(deckPath: string): Promise<CardRecord[]> {
    const db = await this.getDB();
    return db.getAllFromIndex('cards', 'by-deck', deckPath);
  }

  async getAllCards(): Promise<CardRecord[]> {
    const db = await this.getDB();
    return db.getAll('cards');
  }

  async saveCard(card: CardRecord): Promise<void> {
    const db = await this.getDB();
    card.syncedAt = Date.now();
    await db.put('cards', card);
  }

  async deleteCard(id: string): Promise<void> {
    const db = await this.getDB();
    await db.delete('cards', id);
  }

  async upsertCard(id: string, data: Partial<CardRecord>): Promise<CardRecord> {
    const existing = await this.getCard(id);
    const card: CardRecord = {
      id,
      deckPath: data.deckPath || existing?.deckPath || '',
      filePath: data.filePath || existing?.filePath || '',
      content: data.content || existing?.content || '',
      lastModified: data.lastModified || existing?.lastModified || Date.now(),
      syncedAt: Date.now()
    };
    await this.saveCard(card);
    return card;
  }

  // Deck operations
  async getDeck(id: string): Promise<DeckRecord | undefined> {
    const db = await this.getDB();
    return db.get('decks', id);
  }

  async getDeckByPath(path: string): Promise<DeckRecord | undefined> {
    const db = await this.getDB();
    return db.getFromIndex('decks', 'by-path', path);
  }

  async getDecksByParent(parentPath: string | null): Promise<DeckRecord[]> {
    const db = await this.getDB();
    return db.getAllFromIndex('decks', 'by-parent', parentPath ?? '');
  }

  async getAllDecks(): Promise<DeckRecord[]> {
    const db = await this.getDB();
    return db.getAll('decks');
  }

  async saveDeck(deck: DeckRecord): Promise<void> {
    const db = await this.getDB();
    await db.put('decks', deck);
  }

  async deleteDeck(id: string): Promise<void> {
    const db = await this.getDB();
    await db.delete('decks', id);
  }

  // Metadata operations
  async getMetadata(key: string): Promise<unknown> {
    const db = await this.getDB();
    const record = await db.get('metadata', key);
    return record?.value;
  }

  async setMetadata(key: string, value: unknown): Promise<void> {
    const db = await this.getDB();
    await db.put('metadata', { key, value });
  }

  // Sync tracking
  async getLastSyncTime(): Promise<number> {
    return (await this.getMetadata('lastSyncTime')) as number || 0;
  }

  async setLastSyncTime(time: number): Promise<void> {
    await this.setMetadata('lastSyncTime', time);
  }

  async getLastFileScanTime(): Promise<number> {
    return (await this.getMetadata('lastFileScanTime')) as number || 0;
  }

  async setLastFileScanTime(time: number): Promise<void> {
    await this.setMetadata('lastFileScanTime', time);
  }

  async getLastExportTime(): Promise<number> {
    return (await this.getMetadata('lastExportTime')) as number || 0;
  }

  async setLastExportTime(time: number): Promise<void> {
    await this.setMetadata('lastExportTime', time);
  }

  async getLastImportTime(): Promise<number> {
    return (await this.getMetadata('lastImportTime')) as number || 0;
  }

  async setLastImportTime(time: number): Promise<void> {
    await this.setMetadata('lastImportTime', time);
  }

  // Directory path tracking
  async getDirectoryPath(): Promise<string | null> {
    return (await this.getMetadata('directoryPath')) as string | null;
  }

  async setDirectoryPath(path: string): Promise<void> {
    await this.setMetadata('directoryPath', path);
  }

  async clearDirectoryPath(): Promise<void> {
    const db = await this.getDB();
    await db.delete('metadata', 'directoryPath');
  }

  // Clear all data
  async clearAll(): Promise<void> {
    const db = await this.getDB();
    await db.clear('cards');
    await db.clear('decks');
    await db.clear('metadata');
  }
}

export const indexedDBStorage = new IndexedDBStorage();

// Type exports
export type { CardRecord, DeckRecord };
