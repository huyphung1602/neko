<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useReviewStore } from '@/stores/review';
import { useCardStore } from '@/stores/card';
import { parseHiddenSides } from '@/stores/card';

const route = useRoute();
const router = useRouter();
const reviewStore = useReviewStore();
const cardStore = useCardStore();

const deckId = computed(() => route.params.deckId as string | undefined);
const revealedCount = ref(0);

const currentCard = computed(() => reviewStore.currentCard);
const progress = computed(() => reviewStore.progress);
const isComplete = computed(() => reviewStore.isComplete);

const hiddenSides = computed(() =>
  currentCard.value ? parseHiddenSides(currentCard.value.back) : []
);
const hiddenSidesCount = computed(() => hiddenSides.value.length);
const hasMoreSides = computed(() => revealedCount.value < hiddenSidesCount.value);
const isAllRevealed = computed(() => revealedCount.value >= hiddenSidesCount.value && hiddenSidesCount.value > 0);

const renderedFront = computed(() =>
  currentCard.value ? cardStore.renderMarkdown(currentCard.value.front) : ''
);

const revealedSides = computed(() =>
  hiddenSides.value.slice(0, revealedCount.value)
);

const renderedHiddenSides = computed(() =>
  revealedSides.value.map(side => cardStore.renderMarkdown(side))
);

function revealNext() {
  if (hasMoreSides.value) {
    revealedCount.value++;
  }
}

async function markRemembered() {
  await reviewStore.answerCard('good');
  revealedCount.value = 0;
  loadNextCard();
}

async function markForgot() {
  await reviewStore.answerCard('again');
  revealedCount.value = 0;
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

  if (e.code === 'Backspace') {
    endReview();
    return;
  }

  if (e.code === 'Space') {
    e.preventDefault();
  }

  if (isAllRevealed.value) {
    if (e.code === 'Space') {
      markRemembered();
    } else if (e.code === 'KeyF') {
      markForgot();
    }
  } else {
    if (e.code === 'Space') {
      revealNext();
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
  <div class="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <header class="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div class="flex items-center justify-between">
        <button @click="endReview" class="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-400 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div class="text-sm text-gray-500 dark:text-gray-400">
          {{ progress.current }} / {{ progress.total }}
        </div>
        <div class="w-8" />
      </div>
      <!-- Progress bar -->
      <div class="mt-3 h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          class="h-full bg-orange-500 transition-all duration-300"
          :style="{ width: `${progress.percent}%` }"
        ></div>
      </div>
    </header>

    <!-- Complete State -->
    <div v-if="isComplete" class="flex-1 flex items-center justify-center p-6">
      <div class="text-center">
        <div class="text-6xl mb-4">🎉</div>
        <h2 class="text-2xl font-bold mb-2 dark:text-white">Review Complete!</h2>
        <p class="text-gray-500 dark:text-gray-400 mb-6">
          Great job! You've reviewed all your cards for now.
        </p>
        <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 max-w-sm mx-auto mb-6">
          <div class="grid grid-cols-2 gap-4 text-center">
            <div>
              <div class="text-2xl font-bold text-green-500">
                {{ reviewStore.session?.correctCount || 0 }}
              </div>
              <div class="text-sm text-gray-500 dark:text-gray-400">Remembered</div>
            </div>
            <div>
              <div class="text-2xl font-bold text-red-500">
                {{ reviewStore.session?.incorrectCount || 0 }}
              </div>
              <div class="text-sm text-gray-500 dark:text-gray-400">Forgot</div>
            </div>
          </div>
        </div>
        <div class="flex gap-4 justify-center">
          <button @click="endReview" class="btn btn-primary">
            Back to Home
          </button>
          <button
            v-if="reviewStore.session?.incorrectCount && reviewStore.session.incorrectCount > 0"
            @click="reviewStore.startReview(deckId); revealedCount = 0"
            class="btn btn-secondary"
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
        <p class="text-gray-500 dark:text-gray-400 mb-4">
          You're all caught up! Come back later for more reviews.
        </p>
        <button @click="endReview" class="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors">
          Back to Home
        </button>
      </div>
    </div>

    <!-- Card Review -->
    <div v-else class="flex-1 flex flex-col">
      <!-- Top buffer for centering -->
      <div class="flex-shrink-0 h-32"></div>

      <div class="flex-1 flex flex-col max-w-[35rem] mx-auto w-full px-4 pb-4">
        <!-- Card Container -->
        <div class="h-fit bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-y-auto flex flex-col">
          <!-- Card Content -->
          <div class="overflow-y-auto px-8 py-6 flex-1">
            <!-- Front -->
            <div class="prose prose-sm dark:prose-invert max-w-none" v-html="renderedFront"></div>

            <!-- Revealed hidden sides -->
            <template v-for="(side, index) in renderedHiddenSides" :key="index">
              <div class="mx-[-32px] my-4 border-t border-dashed border-gray-300 dark:border-gray-600"></div>
              <div class="prose prose-sm dark:prose-invert max-w-none" v-html="side"></div>
            </template>
          </div>

          <!-- Bottom Hint (Next Side) -->
          <div
            v-if="hasMoreSides"
            @click="revealNext"
            class="border-t border-gray-200 dark:border-gray-700 px-6 py-3 flex items-center justify-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <svg class="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            <span class="text-sm font-medium text-gray-600 dark:text-gray-300">Next Side</span>
            <kbd class="inline-flex items-center justify-center min-w-[28px] h-[22px] px-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-[11px] font-medium text-gray-700 dark:text-gray-200">SPACE</kbd>
          </div>

          <!-- Rating Hint -->
          <div v-else-if="isAllRevealed" class="border-t border-gray-200 dark:border-gray-700 px-6 py-3 text-center">
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Press <kbd class="inline-flex items-center justify-center min-w-[28px] h-[22px] px-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-[11px] font-medium text-gray-700 dark:text-gray-200">SPACE</kbd> to mark as remembered, or <kbd class="inline-flex items-center justify-center min-w-[20px] h-[22px] px-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-[11px] font-medium text-gray-700 dark:text-gray-200">F</kbd> as forgot.
            </p>
          </div>
        </div>
      </div>

      <!-- Teleported Review Buttons to bottom of main content -->
      <Teleport to="body">
        <div v-if="isAllRevealed" class="review-actions-container">
          <div class="flex gap-3 max-w-2xl mx-auto">
            <button
              @click="markForgot"
              class="btn btn-secondary flex-1 inline-flex items-center justify-center"
            >
              <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Forgot
            </button>
            <button
              @click="markRemembered"
              class="btn btn-primary flex-1 inline-flex items-center justify-center"
            >
              <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              Remembered
            </button>
          </div>
        </div>
      </Teleport>
    </div>
  </div>
</template>

<style scoped>
.review-actions-container {
  position: fixed;
  left: 240px;
  right: 0;
  bottom: 0;
  background: #faf9f7;
  border-top: 1px solid #e5e5e5;
  padding: 9px 12px;
}

.dark .review-actions-container {
  background: #111827;
  border-color: #374151;
}
</style>
