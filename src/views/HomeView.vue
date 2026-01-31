<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useCardStore } from '@/stores/card';
import { useDeckStore } from '@/stores/deck';
import { useReviewStore } from '@/stores/review';

const router = useRouter();
const cardStore = useCardStore();
const deckStore = useDeckStore();
const reviewStore = useReviewStore();

const stats = computed(() => ({
  totalCards: cardStore.allCards.length,
  dueCards: cardStore.getDueCardsCount(),
  totalDecks: deckStore.allDecks.length,
  newCards: cardStore.allCards.filter(c => c.state === 'new').length
}));

const recentDecks = computed(() => deckStore.allDecks.slice(0, 4));

async function startReview() {
  await reviewStore.startReview();
  router.push('/review');
}

function startReviewDeck(deckPath: string) {
  reviewStore.startReview(deckPath);
  router.push(`/review?deck=${encodeURIComponent(deckPath)}`);
}

function openDeck(deckPath: string) {
  router.push(`/decks/${deckPath}`);
}
</script>

<template>
  <div class="home dark:bg-gray-900 dark:text-white">
    <!-- Header -->
    <header class="home-header dark:bg-gray-800/50">
      <div class="header-content">
        <div>
          <h1 class="welcome-title dark:text-white">Welcome back!</h1>
          <p class="welcome-subtitle dark:text-gray-400">Ready to review your cards?</p>
        </div>
      </div>
    </header>

    <!-- Stats Cards -->
    <div class="stats-grid">
      <div class="stat-card dark:bg-gray-800 dark:border-gray-700">
        <div class="stat-icon due">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-value dark:text-white">{{ stats.dueCards }}</span>
          <span class="stat-label dark:text-gray-400">Due Today</span>
        </div>
      </div>

      <div class="stat-card dark:bg-gray-800 dark:border-gray-700">
        <div class="stat-icon total">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-value dark:text-white">{{ stats.totalCards }}</span>
          <span class="stat-label dark:text-gray-400">Total Cards</span>
        </div>
      </div>

      <div class="stat-card dark:bg-gray-800 dark:border-gray-700">
        <div class="stat-icon new">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-value dark:text-white">{{ stats.newCards }}</span>
          <span class="stat-label dark:text-gray-400">New Cards</span>
        </div>
      </div>

      <div class="stat-card dark:bg-gray-800 dark:border-gray-700">
        <div class="stat-icon decks">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-value dark:text-white">{{ stats.totalDecks }}</span>
          <span class="stat-label dark:text-gray-400">Decks</span>
        </div>
      </div>
    </div>

    <!-- Main Actions -->
    <div class="actions-section">
      <button
        @click="startReview"
        :disabled="stats.dueCards === 0"
        class="action-card review-action dark:bg-gray-800 dark:border-gray-700"
        :class="{ 'disabled': stats.dueCards === 0 }"
      >
        <div class="action-icon">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <div class="action-content">
          <h3 class="dark:text-white">Review Cards</h3>
          <p class="dark:text-gray-400">{{ stats.dueCards }} cards due for review</p>
        </div>
        <svg class="action-arrow dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <router-link to="/cards/new" class="action-card create-action dark:bg-gray-800 dark:border-gray-700">
        <div class="action-icon">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <div class="action-content">
          <h3 class="dark:text-white">Create Card</h3>
          <p class="dark:text-gray-400">Add a new flashcard</p>
        </div>
        <svg class="action-arrow dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </router-link>

      <router-link to="/decks" class="action-card decks-action dark:bg-gray-800 dark:border-gray-700">
        <div class="action-icon">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div class="action-content">
          <h3 class="dark:text-white">Browse Decks</h3>
          <p class="dark:text-gray-400">{{ stats.totalDecks }} decks available</p>
        </div>
        <svg class="action-arrow dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </router-link>
    </div>

    <!-- Decks Grid -->
    <div v-if="recentDecks.length > 0" class="decks-section">
      <div class="section-header">
        <h2 class="dark:text-white">Your Decks</h2>
        <router-link to="/decks" class="see-all dark:text-orange-400">See all</router-link>
      </div>
      <div class="decks-grid">
        <div
          v-for="deck in recentDecks"
          :key="deck.path"
          @click="openDeck(deck.path)"
          class="deck-card dark:bg-gray-800 dark:border-gray-700"
        >
          <div class="deck-icon dark:bg-orange-500/20">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>
          <div class="deck-info">
            <h3 class="dark:text-white">{{ deck.name }}</h3>
            <p class="dark:text-gray-400">{{ cardStore.getCardsByDeck(deck.path).length }} cards</p>
          </div>
          <div class="deck-actions">
            <button
              @click.stop="startReviewDeck(deck.path)"
              class="deck-review-btn"
              :disabled="cardStore.getCardsByDeck(deck.path).filter(c => c.state === 'new' || (c.nextReviewDate && new Date(c.nextReviewDate) <= new Date())).length === 0"
            >
              Review
            </button>
            <button @click="openDeck(deck.path)" class="deck-view-btn dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600">
              View
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="stats.totalCards === 0" class="empty-state">
      <div class="empty-icon">📚</div>
      <h2 class="dark:text-white">Get started with your first deck</h2>
      <p class="dark:text-gray-400">Create a deck and add some cards to start learning</p>
      <router-link to="/cards/new" class="btn-primary">
        Create Your First Card
      </router-link>
    </div>
  </div>
</template>

<style scoped>
.home {
  padding: 32px;
  max-width: 1200px;
  margin: 0 auto;
}

.home-header {
  margin-bottom: 32px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 16px;
}

.welcome-title {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0 0 4px 0;
}

.welcome-subtitle {
  color: #6b6b6b;
  margin: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 32px;
}

.stat-card {
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.2s;
}

.stat-card:hover {
  border-color: #ed751c;
  box-shadow: 0 4px 12px rgba(237, 117, 28, 0.1);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon.due {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.stat-icon.total {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.stat-icon.new {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.stat-icon.decks {
  background: rgba(237, 117, 28, 0.1);
  color: #ed751c;
}

.stat-value {
  display: block;
  font-size: 28px;
  font-weight: 700;
  color: #1a1a2e;
}

.stat-label {
  font-size: 13px;
  color: #6b6b6b;
}

.actions-section {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 40px;
}

.action-card {
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 16px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  text-decoration: none;
  color: inherit;
  transition: all 0.2s;
  cursor: pointer;
}

.action-card:hover {
  border-color: #ed751c;
  box-shadow: 0 4px 12px rgba(237, 117, 28, 0.1);
  transform: translateY(-2px);
}

.action-card.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.action-card.disabled:hover {
  transform: none;
  box-shadow: none;
}

.action-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.review-action .action-icon {
  background: rgba(237, 117, 28, 0.1);
  color: #ed751c;
}

.create-action .action-icon {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.decks-action .action-icon {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.action-content {
  flex: 1;
}

.action-content h3 {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0 0 4px 0;
}

.action-content p {
  font-size: 13px;
  color: #6b6b6b;
  margin: 0;
}

.action-arrow {
  width: 20px;
  height: 20px;
  color: #6b6b6b;
  transition: all 0.2s;
}

.action-card:hover .action-arrow {
  color: #ed751c;
  transform: translateX(4px);
}

.decks-section {
  margin-bottom: 40px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h2 {
  font-size: 20px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0;
}

.see-all {
  font-size: 14px;
  color: #ed751c;
  text-decoration: none;
  font-weight: 500;
}

.see-all:hover {
  text-decoration: underline;
}

.decks-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.deck-card {
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
}

.deck-card:hover {
  border-color: #ed751c;
  box-shadow: 0 4px 12px rgba(237, 117, 28, 0.1);
  transform: translateY(-2px);
}

.deck-icon {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: rgba(237, 117, 28, 0.1);
  color: #ed751c;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.deck-info h3 {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0 0 4px 0;
}

.deck-info p {
  font-size: 13px;
  color: #6b6b6b;
  margin: 0 0 12px 0;
}

.deck-actions {
  display: flex;
  gap: 8px;
  margin-top: auto;
  width: 100%;
}

.deck-review-btn {
  padding: 6px 12px;
  background: #ed751c;
  border: none;
  border-radius: 6px;
  color: #fff;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  flex: 1;
}

.deck-review-btn:hover:not(:disabled) {
  background: #de5b12;
}

.deck-review-btn:disabled {
  background: #e5e5e5;
  color: #6b6b6b;
  cursor: not-allowed;
}

.deck-view-btn {
  padding: 6px 12px;
  background: #f5f5f5;
  border: none;
  border-radius: 6px;
  color: #1a1a2e;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  flex: 1;
}

.deck-view-btn:hover {
  background: #e5e5e5;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.empty-state h2 {
  font-size: 24px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0 0 8px 0;
}

.empty-state p {
  color: #6b6b6b;
  margin: 0 0 24px 0;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #ed751c;
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover {
  background: #de5b12;
}

@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .actions-section {
    grid-template-columns: 1fr;
  }

  .decks-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .home {
    padding: 20px;
  }

  .header-content {
    flex-direction: column;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .decks-grid {
    grid-template-columns: 1fr;
  }
}

.dark .welcome-title {
  color: #fff;
}

.dark .welcome-subtitle {
  color: #9ca3af;
}

.dark .stat-card {
  background: #1f2937;
  border-color: #374151;
}

.dark .stat-value {
  color: #fff;
}

.dark .stat-label {
  color: #9ca3af;
}

.dark .action-card {
  background: #1f2937;
  border-color: #374151;
}

.dark .action-content h3 {
  color: #fff;
}

.dark .action-content p {
  color: #9ca3af;
}

.dark .action-arrow {
  color: #9ca3af;
}

.dark .section-header h2 {
  color: #fff;
}

.dark .deck-card {
  background: #1f2937;
  border-color: #374151;
}

.dark .deck-info h3 {
  color: #fff;
}

.dark .deck-info p {
  color: #9ca3af;
}

.dark .deck-view-btn {
  background: #374151;
  color: #fff;
}

.dark .deck-view-btn:hover {
  background: #4b5563;
}

.dark .empty-state h2 {
  color: #fff;
}

.dark .empty-state p {
  color: #9ca3af;
}
</style>
