// Card store - manages cards with IndexedDB storage
// File system sync happens separately via workspace store export/import
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import { marked } from 'marked';
import { addDays, isBefore, format } from 'date-fns';
import { indexedDBStorage, type CardRecord } from '@/utils/indexedDB';
import { useWorkspaceStore } from './workspace';

export interface Card {
  id: string;
  deckPath: string;
  filePath: string;
  front: string;
  back: string;
  tags: string[];
  state: 'new' | 'learning' | 'review' | 'mastered';
  nextReviewDate: string | null;
  createdAt: string;
  updatedAt: string;
  lastModified: number;
}

export const useCardStore = defineStore('card', () => {
  const cards = ref<Map<string, Card>>(new Map());
  const isLoading = ref(false);

  const allCards = computed(() => Array.from(cards.value.values()));

  function cardFromRecord(record: CardRecord): Card {
    // Parse front/back from markdown
    // Content format: frontmatter (optional) + "---" + front + "---" + back
    const content = record.content;

    // Find the frontmatter separator (first ---)
    const fmMatch = content.match(/^---\r?\n[\s\S]*?\r?\n---/);
    let contentBody = content;

    if (fmMatch) {
      // Skip past the frontmatter
      contentBody = content.substring(fmMatch[0].length).trim();
    }

    // Now split the body into front and back
    const parts = contentBody.split(/\r?\n---\r?\n/);
    const front = parts[0]?.trim() || '';
    const back = parts[1]?.trim() || '';

    // Extract metadata
    const tagsMatch = record.content.match(/^---\n[\s\S]*?tags:\s*([^\n]+)/m);
    const tagsStr = tagsMatch?.[1] || '';
    const tags = tagsStr.split(',').map(t => t.trim()).filter(Boolean);

    const stateMatch = record.content.match(/^---\n[\s\S]*?state:\s*(\w+)/m);
    const state = (stateMatch?.[1] as Card['state']) || 'new';

    const nextReviewMatch = record.content.match(/^---\n[\s\S]*?nextReviewDate:\s*([^\n]+)/m);
    const nextReviewDate = nextReviewMatch?.[1]?.trim() === 'none' ? null : nextReviewMatch?.[1] || null;

    const createdMatch = record.content.match(/^---\n[\s\S]*?createdAt:\s*([^\n]+)/m);
    const createdAt = createdMatch?.[1] || new Date().toISOString();

    const updatedMatch = record.content.match(/^---\n[\s\S]*?updatedAt:\s*([^\n]+)/m);
    const updatedAt = updatedMatch?.[1] || new Date().toISOString();

    return {
      id: record.id,
      deckPath: record.deckPath,
      filePath: record.filePath,
      front,
      back,
      tags,
      state,
      nextReviewDate,
      createdAt,
      updatedAt,
      lastModified: record.lastModified
    };
  }

  function cardToContent(card: Partial<Card>): string {
    const front = card.front || '';
    const back = card.back || '';

    let content = `---
id: ${card.id}
deckPath: ${card.deckPath || ''}
tags: ${card.tags?.join(', ') || ''}
state: ${card.state || 'new'}
nextReviewDate: ${card.nextReviewDate || 'none'}
createdAt: ${card.createdAt || new Date().toISOString()}
updatedAt: ${new Date().toISOString()}
---
${front}
---
${back}`;
    return content;
  }

  async function loadCards(): Promise<void> {
    const workspaceStore = useWorkspaceStore();
    if (!workspaceStore.isReady) return;

    isLoading.value = true;
    try {
      // Load from IndexedDB (single source of truth)
      const records = await indexedDBStorage.getAllCards();
      console.log('[CardStore] Loaded', records.length, 'cards from IndexedDB');

      cards.value.clear();
      for (const record of records) {
        const card = cardFromRecord(record);
        cards.value.set(card.id, card);
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

  function getAllTags(): string[] {
    const tags = new Set<string>();
    allCards.value.forEach(card => {
      card.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }

  async function createCard(deckPath: string, front: string, back: string, tags: string[] = []): Promise<Card | null> {
    const workspaceStore = useWorkspaceStore();
    if (!workspaceStore.isReady) return null;

    const id = uuidv4();
    const now = new Date().toISOString();
    const fileName = `${id}.md`;
    const filePath = deckPath === '/' ? fileName : `${deckPath}/${fileName}`;

    const card: Card = {
      id,
      deckPath,
      filePath,
      front,
      back,
      tags,
      state: 'new',
      nextReviewDate: null,
      createdAt: now,
      updatedAt: now,
      lastModified: Date.now()
    };

    // Save to IndexedDB only
    const content = cardToContent(card);
    await indexedDBStorage.upsertCard(id, {
      id,
      deckPath,
      filePath,
      content,
      lastModified: Date.now()
    });

    // Update in-memory store
    cards.value.set(id, card);

    return card;
  }

  async function updateCard(id: string, updates: Partial<Card>): Promise<void> {
    const card = cards.value.get(id);
    if (!card) return;

    Object.assign(card, updates, { updatedAt: new Date().toISOString(), lastModified: Date.now() });

    // Update IndexedDB only
    const content = cardToContent(card);
    await indexedDBStorage.upsertCard(id, {
      id: card.id,
      deckPath: card.deckPath,
      filePath: card.filePath,
      content,
      lastModified: card.lastModified
    });

    // Update in-memory store
    cards.value.set(id, card);
  }

  async function deleteCard(id: string): Promise<void> {
    // Delete from IndexedDB
    await indexedDBStorage.deleteCard(id);

    // Remove from in-memory store
    cards.value.delete(id);
  }

  async function reviewCard(cardId: string, quality: 'again' | 'hard' | 'good' | 'easy'): Promise<void> {
    const card = cards.value.get(cardId);
    if (!card) return;

    const now = new Date();

    switch (quality) {
      case 'again':
        card.state = 'learning';
        card.nextReviewDate = format(now, "yyyy-MM-dd'T'HH:mm:ss");
        break;
      case 'hard':
        card.state = 'learning';
        card.nextReviewDate = format(addDays(now, 1), "yyyy-MM-dd'T'HH:mm:ss");
        break;
      case 'good':
        if (card.state === 'new') card.state = 'learning';
        card.nextReviewDate = format(addDays(now, 3), "yyyy-MM-dd'T'HH:mm:ss");
        break;
      case 'easy':
        if (card.state === 'new' || card.state === 'learning') card.state = 'review';
        card.nextReviewDate = format(addDays(now, 7), "yyyy-MM-dd'T'HH:mm:ss");
        break;
    }

    card.updatedAt = now.toISOString();
    card.lastModified = Date.now();

    // Update IndexedDB only
    const content = cardToContent(card);
    await indexedDBStorage.upsertCard(cardId, {
      id: cardId,
      deckPath: card.deckPath,
      filePath: card.filePath,
      content,
      lastModified: card.lastModified
    });

    cards.value.set(cardId, card);
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
    getCardsByDeck,
    getCardsForReview,
    getAllTags,
    createCard,
    updateCard,
    deleteCard,
    reviewCard,
    renderMarkdown,
    getDueCardsCount
  };
});
