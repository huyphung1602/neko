// Core types for Neko Flashcards

export interface Card {
  id: string;
  deckPath: string;
  front: string; // Markdown content
  back: string; // Markdown content (hidden during review)
  tags: string[];
  state: CardState;
  nextReviewDate: string | null; // ISO date string
  createdAt: string;
  updatedAt: string;
  lastModified: number;
}

export type CardState = 'new' | 'learning' | 'review' | 'mastered';

export interface Deck {
  id: string;
  path: string;
  name: string;
  parentPath: string | null; // For nested decks
  lastModified: number;
}

export interface DeckTreeItem {
  deck: Deck;
  children: DeckTreeItem[];
  cardCount: number;
}

export interface ReviewSession {
  cards: Card[];
  currentIndex: number;
  correctCount: number;
  incorrectCount: number;
  startTime: string;
}

export interface Workspace {
  path: string;
  name: string;
  lastOpened: string;
}

export type SortOrder = 'newest' | 'oldest' | 'alphabetical';

export interface CardFilter {
  deckPath: string | null;
  tags: string[];
  state: CardState | 'all';
  searchQuery: string;
}
