// Deck store - manages deck structure via IPC
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useWorkspaceStore } from './workspace';

export interface Deck {
  id: string;
  path: string;
  name: string;
  parentPath: string | null;
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

  async function loadDecks(): Promise<void> {
    const workspaceStore = useWorkspaceStore();
    if (!workspaceStore.isReady) return;

    isLoading.value = true;
    try {
      if (typeof window !== 'undefined' && 'nekos' in window) {
        const deckList = await window.nekos.readDecks();
        console.log('[DeckStore] Loaded', deckList.length, 'decks');

        decks.value.clear();
        for (const deck of deckList) {
          decks.value.set(deck.path, {
            id: deck.path,
            path: deck.path,
            name: deck.name,
            parentPath: deck.parentPath
          });
        }
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

  async function createDeck(name: string, parentPath: string | null = null): Promise<Deck | null> {
    const workspaceStore = useWorkspaceStore();
    if (!workspaceStore.isReady || !workspaceStore.workspacePath) return null;

    // Check if deck already exists
    const fullPath = parentPath ? `${parentPath}/${name}` : `/${name}`;
    if (decks.value.has(fullPath)) {
      console.log('[DeckStore] Deck already exists:', fullPath);
      return decks.value.get(fullPath) || null;
    }

    try {
      if (typeof window !== 'undefined' && 'nekos' in window) {
        await window.nekos.createDeck({
          workspacePath: workspaceStore.workspacePath,
          deckName: name,
          parentPath
        });

        const deck: Deck = {
          id: fullPath,
          path: fullPath,
          name,
          parentPath
        };
        decks.value.set(fullPath, deck);
        return deck;
      }
    } catch (e) {
      console.error('Failed to create deck:', e);
    }
    return null;
  }

  async function deleteDeck(path: string): Promise<void> {
    try {
      if (typeof window !== 'undefined' && 'nekos' in window) {
        await window.nekos.deleteDeck(path);
      }

      // Recursively delete child decks from memory
      const childDecks = allDecks.value.filter(d => d.path.startsWith(path + '/'));
      for (const child of childDecks) {
        decks.value.delete(child.path);
      }
      decks.value.delete(path);
      console.log('[DeckStore] Deleted deck:', path);
    } catch (e) {
      console.error('Failed to delete deck:', e);
    }
  }

  async function renameDeck(path: string, newName: string): Promise<boolean> {
    const deck = decks.value.get(path);
    if (!deck) return false;

    try {
      if (typeof window !== 'undefined' && 'nekos' in window) {
        await window.nekos.renameDeck({ oldPath: path, newName });

        // Update in memory
        const newPath = path.substring(0, path.lastIndexOf('/')) + '/' + newName;
        deck.name = newName;
        deck.path = newPath;
        deck.id = newPath;

        decks.value.delete(path);
        decks.value.set(newPath, deck);

        return true;
      }
    } catch (e) {
      console.error('Failed to rename deck:', e);
    }
    return false;
  }

  return {
    decks,
    allDecks,
    isLoading,
    loadDecks,
    getDeck,
    getDecksByParent,
    deckTreeItems: () => buildDeckTree(),
    createDeck,
    renameDeck,
    deleteDeck
  };
});
