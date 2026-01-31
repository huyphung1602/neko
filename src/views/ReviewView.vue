<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useReviewStore } from '@/stores/review';
import { useCardStore } from '@/stores/card';

const route = useRoute();
const router = useRouter();
const reviewStore = useReviewStore();
const cardStore = useCardStore();

const deckId = computed(() => route.params.deckId as string | undefined);
const showAnswer = ref(false);

const currentCard = computed(() => reviewStore.currentCard);
const progress = computed(() => reviewStore.progress);
const isComplete = computed(() => reviewStore.isComplete);

const renderedFront = computed(() =>
  currentCard.value ? cardStore.renderMarkdown(currentCard.value.front) : ''
);
const renderedBack = computed(() =>
  currentCard.value ? cardStore.renderMarkdown(currentCard.value.back) : ''
);

function showAnswerCard() {
  showAnswer.value = true;
}

async function markRemembered() {
  await reviewStore.answerCard('good');
  showAnswer.value = false;
  loadNextCard();
}

async function markForgot() {
  await reviewStore.answerCard('again');
  showAnswer.value = false;
  loadNextCard();
}

function loadNextCard() {
  if (reviewStore.isComplete) {
    return;
  }
  if (!reviewStore.currentCard) {
    reviewStore.startReview(deckId.value);
  }
}

function endReview() {
  reviewStore.endReview();
  if (deckId.value) {
    router.push(`/decks/${deckId.value}`);
  } else {
    router.push('/');
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (isComplete.value || !currentCard.value) return;

  if (!showAnswer.value) {
    if (e.code === 'Space') {
      e.preventDefault();
      showAnswerCard();
    }
  } else {
    if (e.code === 'Space') {
      e.preventDefault();
      markRemembered();
    } else if (e.code === 'KeyF') {
      e.preventDefault();
      markForgot();
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
  if (!reviewStore.session) {
    reviewStore.startReview(deckId.value);
  }
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});
</script>

<template>
  <div class="h-full flex flex-col bg-neko-bg dark:bg-gray-900">
    <!-- Header -->
    <header class="p-4 border-b border-neko-border bg-neko-card dark:bg-gray-800 dark:border-gray-700">
      <div class="flex items-center justify-between">
        <button @click="endReview" class="btn-ghost dark:text-gray-300 dark:hover:bg-gray-700">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div class="text-sm text-neko-muted dark:text-gray-400">
          {{ progress.current }} / {{ progress.total }}
        </div>
        <div class="w-8" />
      </div>
      <!-- Progress bar -->
      <div class="mt-3 h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          class="h-full bg-primary-500 transition-all duration-300"
          :style="{ width: `${progress.percent}%` }"
        ></div>
      </div>
    </header>

    <!-- Complete State -->
    <div v-if="isComplete" class="flex-1 flex items-center justify-center p-6">
      <div class="text-center">
        <div class="text-6xl mb-4">🎉</div>
        <h2 class="text-2xl font-bold mb-2 dark:text-white">Review Complete!</h2>
        <p class="text-neko-muted dark:text-gray-400 mb-6">
          Great job! You've reviewed all your cards for now.
        </p>
        <div class="card p-6 max-w-sm mx-auto mb-6 dark:bg-gray-800 dark:border-gray-700">
          <div class="grid grid-cols-2 gap-4 text-center">
            <div>
              <div class="text-2xl font-bold text-green-500">
                {{ reviewStore.session?.correctCount || 0 }}
              </div>
              <div class="text-sm text-neko-muted dark:text-gray-400">Remembered</div>
            </div>
            <div>
              <div class="text-2xl font-bold text-red-500">
                {{ reviewStore.session?.incorrectCount || 0 }}
              </div>
              <div class="text-sm text-neko-muted dark:text-gray-400">Forgot</div>
            </div>
          </div>
        </div>
        <div class="flex gap-4 justify-center">
          <button @click="endReview" class="btn btn-primary">
            Back to Home
          </button>
          <button
            v-if="reviewStore.session?.incorrectCount && reviewStore.session.incorrectCount > 0"
            @click="reviewStore.startReview(deckId); showAnswer = false"
            class="btn btn-secondary dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
          >
            Review Again
          </button>
        </div>
      </div>
    </div>

    <!-- No Cards State -->
    <div v-else-if="!currentCard" class="flex-1 flex items-center justify-center p-6">
      <div class="text-center">
        <div class="text-6xl mb-4">📚</div>
        <h2 class="text-xl font-bold mb-2 dark:text-white">No cards to review</h2>
        <p class="text-neko-muted dark:text-gray-400 mb-4">
          You're all caught up! Come back later for more reviews.
        </p>
        <button @click="endReview" class="btn btn-primary">
          Back to Home
        </button>
      </div>
    </div>

    <!-- Card Review -->
    <div v-else class="flex-1 flex flex-col">
      <!-- Card Content -->
      <div class="flex-1 p-4 overflow-y-auto">
        <div class="max-w-2xl mx-auto">
          <!-- Front -->
          <div class="bg-neko-card dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-4">
            <div class="text-xs font-medium text-neko-muted dark:text-gray-400 mb-3 uppercase tracking-wide">
              Question
            </div>
            <div
              class="markdown-content text-lg dark:text-white"
              v-html="renderedFront"
            ></div>
          </div>

          <!-- Back (shown after reveal) -->
          <div
            v-if="showAnswer"
            class="bg-neko-card dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            <div class="text-xs font-medium text-neko-muted dark:text-gray-400 mb-3 uppercase tracking-wide">
              Answer
            </div>
            <div
              class="markdown-content text-lg dark:text-white"
              v-html="renderedBack"
            ></div>
          </div>
        </div>
      </div>

      <!-- Shortcuts Hint -->
      <div class="shortcuts-hint">
        <template v-if="!showAnswer">
          Press <kbd>SPACE</kbd> to show answer
        </template>
        <template v-else>
          Press <kbd>SPACE</kbd> to mark remembered, <kbd>F</kbd> to mark forgot
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.shortcuts-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.03);
  border-top: 1px solid #e5e5e5;
  color: #6b6b6b;
  font-size: 13px;
}

.dark .shortcuts-hint {
  background: rgba(255, 255, 255, 0.03);
  border-top-color: #374151;
  color: rgba(255, 255, 255, 0.7);
}

kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 60px;
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 4px;
  font-family: inherit;
  font-size: 12px;
  font-weight: 500;
  color: inherit;
}

.dark kbd {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.12);
}
</style>
