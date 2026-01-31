// Deck store - manages deck structure with IndexedDB storage
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { indexedDBStorage, type DeckRecord } from '@/utils/indexedDB';
import { useWorkspaceStore } from './workspace';
import { useCardStore } from './card';

export interface Deck {
  id: string;
  path: string;
  name: string;
  parentPath: string | null;
  lastModified: number;
}

export interface DeckTreeItem {
  deck: Deck;
  children: DeckTreeItem[];
  cardCount: number;
}

export const useDeckStore = defineStore('deck', () => {
  const decks = ref<Map<string, Deck>>(new Map());
  const isLoading = ref(false);

  const allDecks = computed(() => Array.from(decks.value.values()));

  function deckFromRecord(record: DeckRecord): Deck {
    return {
      id: record.path,
      path: record.path,
      name: record.name,
      parentPath: record.parentPath,
      lastModified: record.lastModified
    };
  }

  async function loadDecks(): Promise<void> {
    const workspaceStore = useWorkspaceStore();
    if (!workspaceStore.isReady) return;

    isLoading.value = true;
    try {
      // Load from IndexedDB (single source of truth)
      const records = await indexedDBStorage.getAllDecks();
      console.log('[DeckStore] Loaded', records.length, 'decks from IndexedDB');

      decks.value.clear();
      for (const record of records) {
        const deck = deckFromRecord(record);
        decks.value.set(deck.path, deck);
      }
    } catch (e) {
      console.error('Failed to load decks:', e);
    } finally {
      isLoading.value = false;
    }
  }

  function getDeck(path: string): Deck | null {
    return decks.value.get(path) || null;
  }

  function getDecksByParent(parentPath: string | null): Deck[] {
    return allDecks.value.filter(d => d.parentPath === parentPath);
  }

  function buildDeckTree(parentPath: string | null = null, cardCounts?: Map<string, number>): DeckTreeItem[] {
    const childDecks = getDecksByParent(parentPath);
    return childDecks.map(deck => ({
      deck,
      children: buildDeckTree(deck.path, cardCounts),
      cardCount: cardCounts?.get(deck.path) || 0
    }));
  }

  function deckTreeItems(): DeckTreeItem[] {
    const cardStore = useCardStore();
    const cardCounts = new Map<string, number>();

    cardStore.allCards.forEach(card => {
      const count = cardCounts.get(card.deckPath) || 0;
      cardCounts.set(card.deckPath, count + 1);
    });

    return buildDeckTree(null, cardCounts);
  }

  async function createDeck(name: string, parentPath: string | null = null): Promise<Deck | null> {
    const workspaceStore = useWorkspaceStore();
    if (!workspaceStore.isReady) return null;

    // Build full path
    const path = parentPath ? `${parentPath}/${name}` : `/${name}`;

    // Check if deck already exists
    if (decks.value.has(path)) {
      console.log('[DeckStore] Deck already exists:', path);
      return decks.value.get(path) || null;
    }

    // Save to IndexedDB only
    const deckRecord: DeckRecord = {
      id: path,
      path,
      name,
      parentPath,
      lastModified: Date.now()
    };
    await indexedDBStorage.saveDeck(deckRecord);

    // Create in-memory deck
    const deck: Deck = {
      id: path,
      path,
      name,
      parentPath,
      lastModified: Date.now()
    };
    decks.value.set(path, deck);

    return deck;
  }

  async function renameDeck(path: string, newName: string): Promise<boolean> {
    const deck = decks.value.get(path);
    if (!deck) return false;

    const parentPath = deck.parentPath;
    const newPath = parentPath ? `${parentPath}/${newName}` : `/${newName}`;

    // Update all child decks (rebuild their paths)
    const childDecks = allDecks.value.filter(d => d.path.startsWith(path + '/'));
    for (const child of childDecks) {
      const relativePath = child.path.substring(path.length);
      const updatedPath = newPath + relativePath;

      // Update deck
      child.path = updatedPath;
      child.name = updatedPath.split('/').pop() || child.name;

      // Update in IndexedDB
      await indexedDBStorage.saveDeck({
        id: updatedPath,
        path: updatedPath,
        name: child.name,
        parentPath: updatedPath.substring(0, updatedPath.lastIndexOf('/')) || null,
        lastModified: Date.now()
      });

      // Delete old IndexedDB entry
      await indexedDBStorage.deleteDeck(child.id);

      // Update in-memory
      decks.value.delete(child.id);
      decks.value.set(updatedPath, child);

      // Update cards in this deck
      const cardStore = useCardStore();
      const cards = cardStore.getCardsByDeck(child.path);
      for (const card of cards) {
        card.deckPath = updatedPath;
        card.filePath = updatedPath + '/' + card.filePath.split('/').pop();
        await cardStore.updateCard(card.id, card);
      }
    }

    // Update the deck itself
    deck.name = newName;
    deck.path = newPath;

    // Update in IndexedDB
    await indexedDBStorage.saveDeck({
      id: newPath,
      path: newPath,
      name: newName,
      parentPath,
      lastModified: Date.now()
    });
    await indexedDBStorage.deleteDeck(path);

    // Update in-memory
    decks.value.delete(path);
    decks.value.set(newPath, deck);

    console.log('[DeckStore] Renamed deck:', path, '->', newPath);

    return true;
  }

  async function deleteDeck(path: string): Promise<void> {
    const deck = decks.value.get(path);
    if (!deck) return;

    // Recursively delete child decks
    const childDecks = allDecks.value.filter(d => d.path.startsWith(path + '/'));
    for (const child of childDecks) {
      await deleteDeck(child.path);
    }

    // Delete from IndexedDB
    await indexedDBStorage.deleteDeck(path);

    // Remove from in-memory
    decks.value.delete(path);

    console.log('[DeckStore] Deleted deck:', path);
  }

  return {
    decks,
    allDecks,
    isLoading,
    loadDecks,
    getDeck,
    getDecksByParent,
    deckTreeItems,
    createDeck,
    renameDeck,
    deleteDeck
  };
});
