<template>
  <div class="card-display">
    <!-- Front content -->
    <div class="card-content">
      <div class="markdown-content dark:text-white" v-html="renderedFront"></div>
    </div>

    <!-- Hidden sides count (browse mode) -->
    <div v-if="mode === 'browse' && hiddenSidesCount > 0" class="hidden-count">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
      <span>{{ hiddenSidesCount }} hidden side{{ hiddenSidesCount > 1 ? 's' : '' }}</span>
    </div>

    <!-- Hidden sides (revealed one at a time) - review mode only -->
    <template v-for="(_, index) in revealedSides" :key="index">
      <div class="card-content hidden-content">
        <div class="markdown-content dark:text-white" v-html="renderedHiddenSides[index]"></div>
      </div>
    </template>

    <!-- Next Side / Collapse button - review mode only -->
    <div v-if="mode === 'review'">
      <div
        v-if="hasMoreSides"
        class="next-side-btn"
        @click="revealNext"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        <span>Next Side</span>
        <kbd>SPACE</kbd>
      </div>

      <!-- Collapse button (all revealed) -->
      <div
        v-else-if="hiddenSidesCount > 0 && canCollapse"
        class="next-side-btn"
        @click="collapseAll"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
        </svg>
        <span>Collapse</span>
      </div>

      <!-- All sides revealed -->
      <div v-else-if="hiddenSidesCount > 0" class="all-revealed">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        <span>All sides revealed</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useCardStore, parseHiddenSides } from '@/stores/card';

const props = defineProps<{
  cardId: string;
  initialRevealed?: number;
  canCollapse?: boolean;
  mode?: 'browse' | 'review';
}>();

const emit = defineEmits<{
  (e: 'collapse'): void;
}>();

const cardStore = useCardStore();
const revealedCount = ref(props.initialRevealed ?? 0);

const card = computed(() => cardStore.getCard(props.cardId));
const hiddenSides = computed(() => card.value ? parseHiddenSides(card.value.back) : []);
const hiddenSidesCount = computed(() => hiddenSides.value.length);
const hasMoreSides = computed(() => revealedCount.value < hiddenSidesCount.value);

const renderedFront = computed(() =>
  card.value ? cardStore.renderMarkdown(card.value.front) : ''
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

function collapseAll() {
  revealedCount.value = 0;
  emit('collapse');
}

watch(() => props.cardId, () => {
  revealedCount.value = props.initialRevealed ?? 0;
});
</script>

<style scoped>
.card-display {
  padding: 16px 32px;
  cursor: pointer;
}

.card-content {
  font-size: 14px;
  line-height: 1.6;
}

.hidden-content {
  padding-top: 16px;
  margin-top: 16px;
  border-top: 1px dashed #e5e5e5;
}

.dark .hidden-content {
  border-top-color: #374151;
}

.hidden-count {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 16px;
  padding-top: 16px;
  color: #ed751c;
  font-size: 13px;
  font-weight: 500;
}

.dark .hidden-count {
  color: #fb923c;
}

.next-side-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 16px;
  padding: 10px 16px;
  background: transparent;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  color: #6b6b6b;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.next-side-btn:hover {
  background: rgba(0, 0, 0, 0.03);
  border-color: #d1d5db;
}

.dark .next-side-btn {
  background: transparent;
  border-color: #374151;
  color: rgba(255, 255, 255, 0.7);
}

.dark .next-side-btn:hover {
  background: rgba(255, 255, 255, 0.03);
  border-color: #4b5563;
}

.next-side-btn:active {
  transform: scale(0.98);
}

.all-revealed {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 16px;
  padding: 10px 16px;
  color: #10b981;
  font-size: 13px;
  font-weight: 500;
}

.dark .all-revealed {
  color: #34d399;
}

kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 22px;
  padding: 0 6px;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-family: inherit;
  font-size: 11px;
  font-weight: 500;
  color: #374151;
}

.dark kbd {
  background: #1f2937;
  border-color: #4b5563;
  color: #e5e7eb;
}
</style>
