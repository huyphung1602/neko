// Review session store
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useCardStore, type Card } from './card';

export interface ReviewSession {
  cards: Card[];
  currentIndex: number;
  correctCount: number;
  incorrectCount: number;
  startTime: string;
}

export const useReviewStore = defineStore('review', () => {
  const session = ref<ReviewSession | null>(null);
  const isReviewMode = ref(false);

  const currentCard = computed(() => {
    if (!session.value || session.value.currentIndex >= session.value.cards.length) {
      return null;
    }
    return session.value.cards[session.value.currentIndex];
  });

  const progress = computed(() => {
    if (!session.value) return { current: 0, total: 0, percent: 0 };
    const current = Math.min(session.value.currentIndex + 1, session.value.cards.length);
    return {
      current,
      total: session.value.cards.length,
      percent: Math.round((current / session.value.cards.length) * 100)
    };
  });

  const isComplete = computed(() => {
    if (!session.value) return false;
    return session.value.currentIndex >= session.value.cards.length;
  });

  function getCardsInDeckAndNested(deckPath: string): Card[] {
    const cardStore = useCardStore();
    // Get cards that are in the deck or any nested deck (path starts with deckPath + '/')
    return cardStore.allCards.filter(card => {
      return card.deckPath === deckPath || card.deckPath.startsWith(deckPath + '/');
    });
  }

  async function startReview(deckPath?: string): Promise<void> {
    const cardStore = useCardStore();

    let cards: Card[];
    if (deckPath) {
      // Get cards from deck and all nested decks
      cards = getCardsInDeckAndNested(deckPath).filter(c => {
        if (c.state === 'new') return true;
        return c.nextReviewDate && new Date(c.nextReviewDate) <= new Date();
      });
    } else {
      cards = cardStore.getCardsForReview();
    }

    if (cards.length === 0) return;

    // Shuffle cards
    const shuffled = [...cards].sort(() => Math.random() - 0.5);

    session.value = {
      cards: shuffled,
      currentIndex: 0,
      correctCount: 0,
      incorrectCount: 0,
      startTime: new Date().toISOString()
    };

    isReviewMode.value = true;
  }

  async function answerCard(quality: 'again' | 'hard' | 'good' | 'easy'): Promise<void> {
    if (!session.value || !currentCard.value) return;

    const cardStore = useCardStore();

    // Record the answer
    if (quality === 'again' || quality === 'hard') {
      session.value.incorrectCount++;
    } else {
      session.value.correctCount++;
    }

    // Update the card
    await cardStore.reviewCard(currentCard.value.id, quality);

    // Move to next card
    session.value.currentIndex++;
  }

  function flipCard(): void {
    // This is handled by the UI component
  }

  function endReview(): void {
    session.value = null;
    isReviewMode.value = false;
  }

  function skipCard(): void {
    if (!session.value) return;
    session.value.currentIndex++;
  }

  return {
    session,
    isReviewMode,
    currentCard,
    progress,
    isComplete,
    startReview,
    answerCard,
    flipCard,
    endReview,
    skipCard
  };
});
