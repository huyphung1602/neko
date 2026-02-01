// Card store - manages cards via IPC file operations
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import { marked } from 'marked';
import { addDays, isBefore } from 'date-fns';
import { useWorkspaceStore } from './workspace';

export interface Card {
  id: string;
  deckPath: string;
  filePath: string;
  front: string;
  back: string;
  state: 'new' | 'learning' | 'review' | 'mastered';
  nextReviewDate: string | null;
  createdAt: string;
  updatedAt: string;
  lastModified: number;
}

// Helper to split back content into hidden sides
export function parseHiddenSides(back: string): string[] {
  if (!back.trim()) return [];
  return back.split(/\n---\n/).filter(side => side.trim());
}

export const useCardStore = defineStore('card', () => {
  const cards = ref<Map<string, Card>>(new Map());
  const isLoading = ref(false);

  const allCards = computed(() => Array.from(cards.value.values()));

  async function loadCards(): Promise<void> {
    const workspaceStore = useWorkspaceStore();
    if (!workspaceStore.isReady) return;

    isLoading.value = true;
    try {
      if (typeof window !== 'undefined' && 'nekos' in window) {
        const cardList = await window.nekos.readCards();
        console.log('[CardStore] Loaded', cardList.length, 'cards');

        cards.value.clear();
        for (const card of cardList) {
          cards.value.set(card.id, {
            ...card,
            state: card.state as Card['state']
          });
        }
      }
    } catch (e) {
      console.error('Failed to load cards:', e);
    } finally {
      isLoading.value = false;
    }
  }

  function getCard(id: string): Card | null {
    return cards.value.get(id) || null;
  }

  function getCardByFilePath(filePath: string): Card | null {
    return Array.from(cards.value.values()).find(c => c.filePath === filePath) || null;
  }

  function getCardsByDeck(deckPath: string): Card[] {
    return allCards.value.filter(c => c.deckPath === deckPath);
  }

  function getCardsForReview(): Card[] {
    const now = new Date().toISOString();
    return allCards.value.filter(c => {
      if (c.state === 'new') return true;
      return c.nextReviewDate && isBefore(new Date(c.nextReviewDate), new Date(now));
    });
  }

  async function createCard(deckPath: string, front: string, back: string): Promise<Card | null> {
    const workspaceStore = useWorkspaceStore();
    if (!workspaceStore.isReady || !workspaceStore.workspacePath) return null;

    const id = uuidv4();
    const now = new Date().toISOString();
    const fileName = `${id}.md`;
    const deckDirName = deckPath === '/' ? workspaceStore.workspacePath : [workspaceStore.workspacePath, ...deckPath.split('/').filter(Boolean)].join('/');
    const filePath = [deckDirName, fileName].join('/');

    const card: Card = {
      id,
      deckPath,
      filePath,
      front,
      back,
      state: 'new',
      nextReviewDate: null,
      createdAt: now,
      updatedAt: now,
      lastModified: Date.now()
    };

    try {
      if (typeof window !== 'undefined' && 'nekos' in window) {
        await window.nekos.saveCard({
          filePath,
          front,
          back,
          state: 'new',
          nextReviewDate: null
        });
      }
      cards.value.set(id, card);
      return card;
    } catch (e) {
      console.error('Failed to create card:', e);
      return null;
    }
  }

  async function updateCard(id: string, updates: Partial<Card>): Promise<void> {
    const card = cards.value.get(id);
    if (!card) return;

    Object.assign(card, updates, { updatedAt: new Date().toISOString(), lastModified: Date.now() });

    try {
      if (typeof window !== 'undefined' && 'nekos' in window) {
        await window.nekos.saveCard({
          filePath: card.filePath,
          front: card.front,
          back: card.back,
          state: card.state,
          nextReviewDate: card.nextReviewDate
        });
      }
      cards.value.set(id, card);
    } catch (e) {
      console.error('Failed to update card:', e);
    }
  }

  async function deleteCard(id: string): Promise<void> {
    const card = cards.value.get(id);
    if (!card) return;

    try {
      if (typeof window !== 'undefined' && 'nekos' in window) {
        await window.nekos.deleteCard(card.filePath);
      }
      cards.value.delete(id);
    } catch (e) {
      console.error('Failed to delete card:', e);
    }
  }

  async function reviewCard(cardId: string, quality: 'again' | 'hard' | 'good' | 'easy'): Promise<void> {
    const card = cards.value.get(cardId);
    if (!card) return;

    const now = new Date();

    switch (quality) {
      case 'again':
        card.state = 'learning';
        card.nextReviewDate = now.toISOString();
        break;
      case 'hard':
        card.state = 'learning';
        card.nextReviewDate = addDays(now, 1).toISOString();
        break;
      case 'good':
        if (card.state === 'new') card.state = 'learning';
        card.nextReviewDate = addDays(now, 3).toISOString();
        break;
      case 'easy':
        if (card.state === 'new' || card.state === 'learning') card.state = 'review';
        card.nextReviewDate = addDays(now, 7).toISOString();
        break;
    }

    card.updatedAt = now.toISOString();
    card.lastModified = Date.now();

    await updateCard(cardId, card);
  }

  function renderMarkdown(text: string): string {
    return marked.parse(text, { async: false }) as string;
  }

  function getDueCardsCount(): number {
    return getCardsForReview().length;
  }

  return {
    cards,
    allCards,
    isLoading,
    loadCards,
    getCard,
    getCardByFilePath,
    getCardsByDeck,
    getCardsForReview,
    createCard,
    updateCard,
    deleteCard,
    reviewCard,
    renderMarkdown,
    getDueCardsCount
  };
});
