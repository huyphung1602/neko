<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useDeckStore } from '@/stores/deck';
import { useCardStore } from '@/stores/card';
import { useReviewStore } from '@/stores/review';
import CardModal from '@/components/CardModal.vue';

const route = useRoute();
const router = useRouter();
const deckStore = useDeckStore();
const cardStore = useCardStore();
const reviewStore = useReviewStore();

const deckPath = computed(() => {
  const id = route.params.id as string;
  return id.startsWith('/') ? decodeURIComponent(id) : '/' + decodeURIComponent(id);
});
const deck = computed(() => deckStore.getDeck(deckPath.value));
const cards = computed(() => cardStore.getCardsByDeck(deckPath.value));

// Get all cards in deck and nested decks for Cram
const allCardsInDeck = computed(() => {
  return cardStore.allCards.filter(card =>
    card.deckPath === deckPath.value || card.deckPath.startsWith(deckPath.value + '/')
  );
});

const searchQuery = ref('');
const showAddCardModal = ref(false);
const showEditCardModal = ref(false);
const editingCardId = ref<string | null>(null);
const viewingCard = ref<typeof cards.value[0] | null>(null);
const expandedCards = ref<Set<string>>(new Set());
const showActionsMenu = ref<string | null>(null);
const dropdownPosition = ref({ top: 0, left: 0 });
const dropdownRef = ref<HTMLElement | null>(null);

const filteredCards = computed(() => {
  let result = cards.value;

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(c =>
      c.front.toLowerCase().includes(query) ||
      c.back.toLowerCase().includes(query)
    );
  }

  return result;
});

async function cramDeck() {
  const cardsToCram = allCardsInDeck.value;
  if (cardsToCram.length === 0) return;

  // Reset all cards to new state for cram session
  for (const card of cardsToCram) {
    await cardStore.updateCard(card.id, { state: 'new', nextReviewDate: null });
  }

  // Start review session
  await reviewStore.startReview(deckPath.value);
  router.push(`/review?deck=${encodeURIComponent(deckPath.value)}`);
}

function toggleExpand(cardId: string) {
  const newExpanded = new Set(expandedCards.value);
  if (newExpanded.has(cardId)) {
    newExpanded.delete(cardId);
  } else {
    newExpanded.add(cardId);
  }
  expandedCards.value = newExpanded;
}

function viewCard(card: typeof cards.value[0]) {
  viewingCard.value = card;
  expandedCards.value.delete(card.id);
}

function closeViewCard() {
  viewingCard.value = null;
}

function editCard(cardId: string) {
  viewingCard.value = null;
  editingCardId.value = cardId;
  showEditCardModal.value = true;
  showActionsMenu.value = null;
}

function closeEditCard() {
  showEditCardModal.value = false;
  editingCardId.value = null;
}

async function deleteCard(cardId: string) {
  if (confirm('Are you sure you want to delete this card?')) {
    await cardStore.deleteCard(cardId);
    viewingCard.value = null;
    expandedCards.value.delete(cardId);
  }
}

async function addToReview(cardId: string) {
  await cardStore.updateCard(cardId, { state: 'new', nextReviewDate: null });
  showActionsMenu.value = null;
}

function createNewCard() {
  showAddCardModal.value = true;
}

function handleCardSaved() {
  showAddCardModal.value = false;
}

function toggleActionsMenu(cardId: string) {
  if (showActionsMenu.value === cardId) {
    showActionsMenu.value = null;
    return;
  }
  showActionsMenu.value = cardId;
  updateDropdownPosition(cardId);
}

function updateDropdownPosition(cardId: string) {
  const cardElement = document.querySelector(`[data-card-id="${cardId}"]`);
  if (!cardElement) return;

  const rect = cardElement.getBoundingClientRect();
  // Position dropdown at top-right of the card, with some offset
  dropdownPosition.value = {
    top: rect.top + 8,
    left: rect.right - 140 // 140px is roughly dropdown width
  };
}

function handleClickOutside(e: MouseEvent) {
  if (showActionsMenu.value && dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
    const target = e.target as HTMLElement;
    if (!target.closest(`[data-card-id="${showActionsMenu.value}"]`)) {
      showActionsMenu.value = null;
    }
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    showActionsMenu.value = null;
  }
}

function handleResize() {
  if (showActionsMenu.value) {
    updateDropdownPosition(showActionsMenu.value);
  }
}

onMounted(() => {
  window.addEventListener('resize', handleResize);
  window.addEventListener('scroll', handleResize, true);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  window.removeEventListener('scroll', handleResize, true);
});
</script>

<template>
  <div class="h-full flex flex-col dark:bg-gray-900 dark:text-white" @click="handleClickOutside" @keydown="handleKeydown">
    <header class="p-4 border-b border-neko-border dark:border-gray-700">
      <div class="flex items-center justify-between gap-4">
        <div>
          <div class="text-xs text-neko-muted dark:text-gray-400">{{ deck?.path }}</div>
          <h1 class="text-lg font-bold dark:text-white">{{ deck?.name }}</h1>
          <p class="text-xs text-neko-muted dark:text-gray-400">{{ cards.length }} cards</p>
        </div>

        <!-- Search + Actions -->
        <div class="flex items-center gap-2 flex-1 max-w-xl">
          <!-- Search -->
          <div class="relative flex-1">
            <svg class="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              v-model="searchQuery"
              type="text"
              class="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Search cards..."
            />
          </div>

          <!-- Cram Button -->
          <button
            @click="cramDeck"
            :disabled="allCardsInDeck.length === 0"
            class="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
            title="Quick review filtered / searched cards. Does not affect review scheduling"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>Cram</span>
            <span class="ml-1 px-1.5 py-0.5 bg-orange-600 rounded-full text-xs">{{ allCardsInDeck.length }}</span>
          </button>

          <!-- Add Card Button -->
          <button
            @click="createNewCard"
            class="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium transition-colors"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Card</span>
          </button>
        </div>
      </div>
    </header>

    <!-- Cards Grid -->
    <div class="flex-1 overflow-y-auto p-4">
      <div v-if="filteredCards.length === 0" class="text-center py-12">
        <div class="text-6xl mb-4">📝</div>
        <h2 class="text-xl font-semibold mb-2 dark:text-white">No cards yet</h2>
        <p class="text-neko-muted dark:text-gray-400 mb-4">Add your first card to this deck</p>
        <button @click="createNewCard" class="btn btn-primary">
          Add Card
        </button>
      </div>

      <div v-else class="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
        <div
          v-for="card in filteredCards"
          :key="card.id"
          :data-card-id="card.id"
          class="relative bg-white dark:bg-gray-800 border border-gray-200 h-fit
          dark:border-gray-700 rounded-xl overflow-hidden transition-all hover:shadow-lg"
        >
          <div class="p-3 cursor-pointer min-h-[100px]" @click="toggleExpand(card.id)">
            <!-- Front side always visible -->
            <div class="prose prose-sm dark:prose-invert max-w-none" v-html="cardStore.renderMarkdown(card.front)"></div>

            <!-- Hidden indicator -->
            <div v-if="!expandedCards.has(card.id)" class="flex items-center gap-1.5 mt-2 pt-2 border-t border-gray-100 dark:border-gray-700 text-xs text-orange-500">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              1 hidden side
            </div>

            <!-- Back side -->
            <div v-if="expandedCards.has(card.id)" class="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700 prose prose-sm dark:prose-invert max-w-none">
              <div v-html="cardStore.renderMarkdown(card.back)"></div>
            </div>
          </div>

          <!-- Actions menu button -->
          <div class="absolute top-2 right-2">
            <button
              class="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-white transition-all opacity-0 hover:opacity-100"
              :class="{ '!opacity-100 !text-gray-600 dark:!text-white': showActionsMenu === card.id }"
              @click.stop="toggleActionsMenu(card.id)"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Teleported Actions Dropdown -->
    <Teleport to="body">
      <div
        v-if="showActionsMenu"
        ref="dropdownRef"
        class="fixed z-[150] bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden pointer-events-auto"
        :style="{ top: `${dropdownPosition.top}px`, left: `${dropdownPosition.left}px` }"
      >
        <button
          @click="viewCard(cards.find(c => c.id === showActionsMenu)!); showActionsMenu = null"
          class="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          View
        </button>
        <button
          @click="editCard(showActionsMenu); showActionsMenu = null"
          class="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          Edit
        </button>
        <button
          @click="addToReview(showActionsMenu)"
          class="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Add to Review
        </button>
        <button
          @click="deleteCard(showActionsMenu); showActionsMenu = null"
          class="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Delete
        </button>
      </div>
    </Teleport>

    <!-- Add Card Modal -->
    <CardModal
      v-model="showAddCardModal"
      :initialDeck="deckPath"
      @saved="handleCardSaved"
    />

    <!-- Edit Card Modal -->
    <CardModal
      v-model="showEditCardModal"
      :editCardId="editingCardId"
      @saved="closeEditCard"
    />

    <!-- View Card Modal -->
    <Teleport to="body">
      <div v-if="viewingCard" class="fixed inset-0 z-[200] flex items-center justify-center p-4" @click="closeViewCard">
        <div class="fixed inset-0 bg-black/50" @click="closeViewCard"></div>
        <div class="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-h-[90vh] overflow-hidden">
          <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Card Details</h2>
            <button @click="closeViewCard" class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
              <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div class="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            <div class="mb-6">
              <div class="text-sm text-gray-500 dark:text-gray-400 mb-2">FRONT</div>
              <div class="prose dark:prose-invert max-w-none p-4 bg-gray-50 dark:bg-gray-800 rounded-lg" v-html="cardStore.renderMarkdown(viewingCard.front)"></div>
            </div>
            <hr class="border-gray-200 dark:border-gray-700" />
            <div class="mt-6">
              <div class="text-sm text-gray-500 dark:text-gray-400 mb-2">BACK</div>
              <div class="prose dark:prose-invert max-w-none p-4 bg-gray-50 dark:bg-gray-800 rounded-lg" v-html="cardStore.renderMarkdown(viewingCard.back)"></div>
            </div>
          </div>
          <div class="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <button @click="deleteCard(viewingCard.id)" class="btn btn-ghost text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">Delete</button>
            <button @click="editCard(viewingCard.id)" class="btn btn-primary">Edit</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style>
/* Custom scrollbar for cards grid */
.cards-scroll {
  scrollbar-width: thin;
  scrollbar-color: #d1d5db transparent;
}

.dark .cards-scroll {
  scrollbar-color: #4b5563 transparent;
}
</style>
