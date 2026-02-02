<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useDeckStore } from '@/stores/deck';
import { useCardStore, parseHiddenSides } from '@/stores/card';
import { useReviewStore } from '@/stores/review';
import { useMetadataStore } from '@/stores/metadata';
import CardModal from '@/components/CardModal.vue';
import CardDisplay from '@/components/CardDisplay.vue';

const route = useRoute();
const router = useRouter();
const deckStore = useDeckStore();
const cardStore = useCardStore();
const reviewStore = useReviewStore();
const metadataStore = useMetadataStore();

const isLoading = ref(true);

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
const showCardActionsMenu = ref(false);
const cardActionsPosition = ref({ top: 0, left: 0 });
const cardActionsRef = ref<HTMLElement | null>(null);

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

// Get review count for a card from metadata store
function getReviewCount(cardId: string): number {
  return metadataStore.getReviewCount(cardId);
}

// Get hidden sides for view card modal
const viewHiddenSides = computed(() => {
  if (!viewingCard.value) return [];
  return parseHiddenSides(viewingCard.value.back);
});

// Get child decks for this deck
const childDecks = computed(() => {
  return deckStore.getDecksByParent(deckPath.value);
});

// Get count of nested decks (recursive)
function getChildDeckCount(deckPath: string): number {
  const children = deckStore.getDecksByParent(deckPath);
  if (children.length === 0) return 0;
  let count = children.length;
  for (const child of children) {
    count += getChildDeckCount(child.path);
  }
  return count;
}

// Combined items (decks first, then cards) for the grid
const combinedItems = computed(() => {
  const items: Array<{
    id: string;
    type: 'deck' | 'card';
    path?: string;
    name?: string;
    cardCount?: number;
    nestedDeckCount?: number;
  }> = [];

  // Add deck items first
  for (const deck of childDecks.value) {
    items.push({
      id: deck.path,
      type: 'deck',
      path: deck.path,
      name: deck.name,
      cardCount: cardStore.getCardsByDeck(deck.path).length,
      nestedDeckCount: getChildDeckCount(deck.path)
    });
  }

  // Add card items
  for (const card of filteredCards.value) {
    items.push({
      id: card.id,
      type: 'card'
    });
  }

  return items;
});

// Navigate to child deck
function openChildDeck(path: string) {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  router.push(`/decks/${encodeURIComponent(cleanPath)}`);
}

// Review a deck
function reviewDeck(path: string) {
  reviewStore.startReview(path);
  router.push(`/review?deck=${encodeURIComponent(path)}`);
}

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

function viewCard(card: typeof cards.value[0]) {
  viewingCard.value = card;
}

function closeViewCard() {
  viewingCard.value = null;
  showCardActionsMenu.value = false;
}

function toggleCardActionsMenu(e: MouseEvent) {
  e.stopPropagation();
  if (showCardActionsMenu.value) {
    showCardActionsMenu.value = false;
    return;
  }
  const button = e.currentTarget as HTMLElement;
  const rect = button.getBoundingClientRect();
  showCardActionsMenu.value = true;
  cardActionsPosition.value = {
    top: rect.bottom + 8,
    left: rect.right - 140
  };
}

function editCard(cardId: string) {
  viewingCard.value = null;
  editingCardId.value = cardId;
  showEditCardModal.value = true;
}

function closeEditCard() {
  showEditCardModal.value = false;
  editingCardId.value = null;
}

async function deleteCard(cardId: string) {
  if (confirm('Are you sure you want to delete this card?')) {
    await cardStore.deleteCard(cardId);
    viewingCard.value = null;
  }
}

function createNewCard() {
  showAddCardModal.value = true;
}

function handleCardSaved() {
  showAddCardModal.value = false;
}

function handleClickOutside(e: MouseEvent) {
  if (showCardActionsMenu.value && cardActionsRef.value && !cardActionsRef.value.contains(e.target as Node)) {
    showCardActionsMenu.value = false;
  }
}

onMounted(async () => {
  // Ensure decks and metadata are loaded
  await deckStore.loadDecks();
  await metadataStore.loadMetadata();
  isLoading.value = false;
});
</script>

<template>
  <div class="h-full flex flex-col dark:bg-gray-900 dark:text-white" @click="handleClickOutside">
    <!-- Loading state -->
    <div v-if="isLoading" class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <div class="text-4xl mb-4">🐱</div>
        <p class="text-gray-500 dark:text-gray-400">Loading...</p>
      </div>
    </div>

    <!-- Deck not found state -->
    <div v-else-if="!deck" class="flex-1 flex items-center justify-center p-6">
      <div class="text-center">
        <div class="text-6xl mb-4">📁</div>
        <h2 class="text-xl font-bold mb-2 dark:text-white">Deck Not Found</h2>
        <p class="text-gray-500 dark:text-gray-400 mb-4">
          The deck "{{ deckPath }}" could not be found.
        </p>
        <button @click="router.push('/decks')" class="btn btn-primary">
          Back to Decks
        </button>
      </div>
    </div>

    <!-- Deck content -->
    <template v-else>
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

    <!-- Content Grid (Decks + Cards) -->
    <div class="flex-1 overflow-y-auto p-4">
      <!-- Empty state when no decks and no cards -->
      <div v-if="combinedItems.length === 0" class="text-center py-12">
        <div class="text-6xl mb-4">📝</div>
        <h2 class="text-xl font-semibold mb-2 dark:text-white">No cards yet</h2>
        <p class="text-neko-muted dark:text-gray-400 mb-4">Add your first card to this deck</p>
        <button @click="createNewCard" class="btn btn-primary">
          Add Card
        </button>
      </div>

      <div v-else class="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
        <!-- Deck Cards (first) -->
        <template v-for="item in combinedItems" :key="item.id">
          <!-- Deck Card -->
          <div
            v-if="item.type === 'deck'"
            @click="openChildDeck(item.path!)"
            class="h-fit relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden cursor-pointer hover:border-orange-500 dark:hover:border-orange-500 transition-all hover:shadow-lg"
          >
            <div class="p-4">
              <div class="flex items-start justify-between mb-3">
                <div class="flex items-center gap-2">
                  <svg class="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  <span class="font-semibold dark:text-white">{{ item.name }}</span>
                </div>
                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <div class="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                <span class="flex items-center gap-1">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  {{ item.cardCount }} cards
                </span>
                <span v-if="(item.nestedDeckCount ?? 0) > 0" class="flex items-center gap-1">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  {{ item.nestedDeckCount }} decks
                </span>
              </div>
            </div>
            <div class="px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-100 dark:border-gray-600 flex items-center justify-between">
              <span class="text-xs text-gray-400 dark:text-gray-500">Deck</span>
              <button
                @click.stop="reviewDeck(item.path!)"
                class="flex items-center gap-1 text-xs text-orange-500 hover:text-orange-600 dark:text-orange-400 font-medium"
              >
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Review
              </button>
            </div>
          </div>

          <!-- Regular Card -->
          <div
            v-else
            :data-card-id="item.id"
            class="h-fit relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden transition-all hover:shadow-lg"
          >
            <CardDisplay
              :cardId="item.id"
              mode="browse"
              @click="viewCard(cardStore.getCard(item.id)!)"
            />
          </div>
        </template>
      </div>
    </div>

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
        <div class="relative w-full max-w-[35rem] bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col" @click.stop>
          <!-- Top Actions -->
          <div class="flex items-center justify-end p-2">
            <div class="relative">
              <button
                @click="toggleCardActionsMenu"
                class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01" />
                </svg>
              </button>
              <!-- Actions Dropdown -->
              <div
                v-if="showCardActionsMenu"
                ref="cardActionsRef"
                class="fixed z-[210] bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                :style="{ top: `${cardActionsPosition.top}px`, left: `${cardActionsPosition.left}px` }"
                @click.stop
              >
                <button
                  @click="editCard(viewingCard.id); showCardActionsMenu = false"
                  class="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Edit
                </button>
                <button
                  @click="deleteCard(viewingCard.id); showCardActionsMenu = false"
                  class="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              </div>
            </div>
          </div>

          <!-- Card Content -->
          <div class="flex-1 overflow-y-auto px-8 py-4">
            <!-- Front -->
            <div class="prose prose-sm dark:prose-invert max-w-none" v-html="cardStore.renderMarkdown(viewingCard.front)"></div>

            <!-- Hidden sides (using same separator pattern as review) -->
            <template v-for="(side, index) in viewHiddenSides" :key="index">
              <div class="mx-[-32px] my-4 border-t border-dashed border-gray-300 dark:border-gray-600"></div>
              <div class="prose prose-sm dark:prose-invert max-w-none" v-html="cardStore.renderMarkdown(side)"></div>
            </template>
          </div>

          <!-- Bottom Info -->
          <div class="border-t border-gray-200 dark:border-gray-700 px-4 py-3 bg-gray-50 dark:bg-gray-800/50">
            <!-- Deck breadcrumb -->
            <div class="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 mb-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <span class="font-medium">{{ viewingCard.deckPath }}</span>
            </div>

            <!-- Review count -->
            <div class="flex items-center gap-4 text-sm">
              <div class="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>{{ getReviewCount(viewingCard.id) }} Reviews</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
    </template>
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
