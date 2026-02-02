<script setup lang="ts">
import { ref } from 'vue';
import { useDeckStore } from '@/stores/deck';
import { useCardStore } from '@/stores/card';
import { useReviewStore } from '@/stores/review';
import { useRouter } from 'vue-router';

const deckStore = useDeckStore();
const cardStore = useCardStore();
const reviewStore = useReviewStore();
const router = useRouter();

const showCreateModal = ref(false);
const newDeckName = ref('');
const selectedParentPath = ref<string | null>(null);

async function createDeck() {
  if (!newDeckName.value.trim()) return;

  const deck = await deckStore.createDeck(newDeckName.value.trim(), selectedParentPath.value || undefined);
  newDeckName.value = '';
  selectedParentPath.value = null;
  showCreateModal.value = false;
  // Reload decks without full page refresh
  await deckStore.loadDecks();
  // Navigate to the new deck if created
  if (deck) {
    const cleanPath = deck.path.startsWith('/') ? deck.path.slice(1) : deck.path;
    router.push(`/decks/${encodeURIComponent(cleanPath)}`);
  }
}

function openDeck(deckPath: string) {
  const cleanPath = deckPath.startsWith('/') ? deckPath.slice(1) : deckPath;
  router.push(`/decks/${encodeURIComponent(cleanPath)}`);
}

async function deleteDeck(deckPath: string, event: Event) {
  event.stopPropagation();
  if (confirm('Are you sure you want to delete this deck and all its cards?')) {
    await deckStore.deleteDeck(deckPath);
    // Reload decks without full page refresh
    await deckStore.loadDecks();
  }
}
</script>

<template>
  <div class="h-full flex flex-col dark:bg-gray-900 dark:text-white">
    <header class="p-6 border-b border-neko-border dark:border-gray-700 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold dark:text-white">Decks</h1>
        <p class="text-neko-muted dark:text-gray-400">Organize your cards into decks</p>
      </div>
      <button @click="showCreateModal = true" class="btn btn-primary inline-flex items-center">
        <svg class="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        New Deck
      </button>
    </header>

    <div class="p-6 flex-1 overflow-y-auto">
      <div v-if="deckStore.allDecks.length === 0" class="text-center py-12">
        <div class="text-6xl mb-4">📁</div>
        <h2 class="text-xl font-semibold mb-2 dark:text-white">No decks yet</h2>
        <p class="text-neko-muted dark:text-gray-400 mb-4">Create your first deck to organize your cards</p>
        <button @click="showCreateModal = true" class="btn btn-primary">
          Create Deck
        </button>
      </div>

      <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="deck in deckStore.allDecks"
          :key="deck.path"
          class="card p-4 hover:border-primary-300 cursor-pointer transition-colors dark:bg-gray-800 dark:border-gray-700"
          @click="openDeck(deck.path)"
        >
          <div class="flex items-start justify-between mb-2">
            <h3 class="font-semibold text-lg dark:text-white">{{ deck.name }}</h3>
            <button
              @click.stop="deleteDeck(deck.path, $event)"
              class="text-neko-muted dark:text-gray-400 hover:text-red-500 p-1"
              title="Delete deck"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>

          <div class="text-sm text-neko-muted dark:text-gray-400 mb-2">
            {{ deck.path }}
          </div>

          <div class="flex items-center justify-between">
            <span class="badge badge-gray dark:bg-gray-700 dark:text-gray-300">
              {{ cardStore.getCardsByDeck(deck.path).length }} cards
            </span>
            <button
              @click.stop="reviewStore.startReview(deck.path); router.push(`/review?deck=${encodeURIComponent(deck.path)}`)"
              class="text-xs text-primary-500 hover:text-primary-600 dark:text-primary-400"
            >
              Review Deck
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Deck Modal -->
    <Teleport to="body">
      <div v-if="showCreateModal" class="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-black/50" @click="showCreateModal = false"></div>
        <div class="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6">
        <h2 class="text-xl font-bold mb-4 dark:text-white">Create New Deck</h2>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1 dark:text-gray-300">Deck Name</label>
            <input
              v-model="newDeckName"
              type="text"
              class="input dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              placeholder="e.g., Japanese Vocabulary"
              @keyup.enter="createDeck"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-1 dark:text-gray-300">Parent Deck (optional)</label>
            <select v-model="selectedParentPath" class="input dark:bg-gray-700 dark:border-gray-600 dark:text-white">
              <option :value="null">No parent (root deck)</option>
              <option v-for="deck in deckStore.allDecks" :key="deck.path" :value="deck.path">
                {{ deck.path }}
              </option>
            </select>
          </div>
        </div>

        <div class="flex justify-end gap-2 mt-6">
          <button @click="showCreateModal = false" class="btn btn-secondary dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600">
            Cancel
          </button>
          <button @click="createDeck" class="btn btn-primary" :disabled="!newDeckName.trim()">
            Create Deck
          </button>
        </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
