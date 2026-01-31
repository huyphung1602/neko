<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useReviewStore } from '@/stores/review';
import { useCardStore } from '@/stores/card';

const route = useRoute();
const router = useRouter();
const reviewStore = useReviewStore();
const cardStore = useCardStore();

const deckId = computed(() => route.params.deckId as string | undefined);
const isFlipped = ref(false);

const currentCard = computed(() => reviewStore.currentCard);
const progress = computed(() => reviewStore.progress);
const isComplete = computed(() => reviewStore.isComplete);

const renderedFront = computed(() =>
  currentCard.value ? cardStore.renderMarkdown(currentCard.value.front) : ''
);
const renderedBack = computed(() =>
  currentCard.value ? cardStore.renderMarkdown(currentCard.value.back) : ''
);

function flipCard() {
  isFlipped.value = !isFlipped.value;
}

async function answer(quality: 'again' | 'hard' | 'good' | 'easy') {
  await reviewStore.answerCard(quality);
  isFlipped.value = false;
}

function endReview() {
  reviewStore.endReview();
  if (deckId.value) {
    router.push(`/decks/${deckId.value}`);
  } else {
    router.push('/');
  }
}

// Start review on mount
onMounted(async () => {
  if (!reviewStore.session) {
    await reviewStore.startReview(deckId.value);
  }
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
        <div class="w-8" /> <!-- Spacer -->
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
              <div class="text-sm text-neko-muted dark:text-gray-400">Correct</div>
            </div>
            <div>
              <div class="text-2xl font-bold text-red-500">
                {{ reviewStore.session?.incorrectCount || 0 }}
              </div>
              <div class="text-sm text-neko-muted dark:text-gray-400">Needs Work</div>
            </div>
          </div>
        </div>
        <div class="flex gap-4 justify-center">
          <button @click="endReview" class="btn btn-primary">
            Back to Home
          </button>
          <button
            v-if="reviewStore.session?.incorrectCount && reviewStore.session.incorrectCount > 0"
            @click="reviewStore.startReview(deckId); isFlipped = false"
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
    <div v-else class="flex-1 flex flex-col p-4">
      <!-- Card -->
      <div class="flex-1 flex items-center justify-center">
        <div
          class="w-full max-w-2xl flip-container cursor-pointer"
          @click="flipCard"
        >
          <div
            class="flip-card bg-neko-card rounded-2xl shadow-lg overflow-hidden dark:bg-gray-800"
            :class="{ flipped: isFlipped }"
            style="min-height: 400px;"
          >
            <div class="flip-inner">
              <!-- Front -->
              <div class="flip-face flip-front-face p-8 flex flex-col">
                <div class="text-xs font-medium text-neko-muted dark:text-gray-400 mb-4 uppercase tracking-wide">
                  Question
                </div>
                <div
                  class="flex-1 markdown-content text-lg dark:text-white"
                  v-html="renderedFront"
                ></div>
                <div v-if="!isFlipped" class="mt-auto pt-4 text-center text-sm text-neko-muted dark:text-gray-400">
                  Tap to reveal answer
                </div>
              </div>

              <!-- Back -->
              <div class="flip-face flip-back-face p-8 flex flex-col">
                <div class="text-xs font-medium text-neko-muted dark:text-gray-400 mb-4 uppercase tracking-wide">
                  Answer
                </div>
                <div
                  class="flex-1 markdown-content text-lg back-content dark:text-white"
                  v-html="renderedBack"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Answer Buttons -->
      <div v-if="isFlipped" class="mt-4">
        <div class="text-center text-sm text-neko-muted dark:text-gray-400 mb-3">
          How well did you know this?
        </div>
        <div class="grid grid-cols-4 gap-2">
          <button
            @click="answer('again')"
            class="btn py-3 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900/70"
          >
            <div class="text-sm font-medium">Again</div>
            <div class="text-xs opacity-75">&lt; 1m</div>
          </button>
          <button
            @click="answer('hard')"
            class="btn py-3 bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/50 dark:text-orange-300 dark:hover:bg-orange-900/70"
          >
            <div class="text-sm font-medium">Hard</div>
            <div class="text-xs opacity-75">1d</div>
          </button>
          <button
            @click="answer('good')"
            class="btn py-3 bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/50 dark:text-green-300 dark:hover:bg-green-900/70"
          >
            <div class="text-sm font-medium">Good</div>
            <div class="text-xs opacity-75">3d</div>
          </button>
          <button
            @click="answer('easy')"
            class="btn py-3 bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900/70"
          >
            <div class="text-sm font-medium">Easy</div>
            <div class="text-xs opacity-75">7d</div>
          </button>
        </div>
      </div>

      <!-- Flip Button (when not flipped) -->
      <div v-else class="mt-4">
        <button @click="flipCard" class="btn btn-primary w-full py-4 text-lg">
          Show Answer
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.flip-container {
  perspective: 1000px;
}

.flip-card {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 400px;
}

.flip-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.6s;
  transform-style: preserve-3d;
}

.flip-card.flipped .flip-inner {
  transform: rotateY(180deg);
}

.flip-face {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  background: white;
  color: #1a1a2e;
}

.dark .flip-face {
  background: #1f2937;
  color: #f9fafb;
}

.flip-front-face {
  transform: rotateY(0deg);
  z-index: 2;
}

.flip-back-face {
  transform: rotateY(180deg);
}

/* Counter-rotate the back content so it reads normally */
.back-content {
  transform: rotateY(180deg);
}
</style>
