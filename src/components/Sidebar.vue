<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useCardStore } from '@/stores/card';
import { useDeckStore } from '@/stores/deck';
import CardModal from '@/components/CardModal.vue';
import DeckTreeItem from '@/components/DeckTreeItem.vue';

const router = useRouter();
const route = useRoute();
const cardStore = useCardStore();
const deckStore = useDeckStore();

const dueCount = computed(() => cardStore.getDueCardsCount());

// Build deck tree from flat list
interface DeckTreeNode {
  deck: { id: string; path: string; name: string; parentPath: string | null; lastModified: number };
  children: DeckTreeNode[];
}

function buildDeckTree(decks: typeof deckStore.allDecks): DeckTreeNode[] {
  const deckMap = new Map<string, DeckTreeNode>();
  const roots: DeckTreeNode[] = [];

  // First pass: create all tree items
  for (const deck of decks) {
    deckMap.set(deck.id, {
      deck,
      children: []
    });
  }

  // Second pass: link children to parents
  for (const deck of decks) {
    const item = deckMap.get(deck.id)!;
    if (deck.parentPath) {
      // Find parent by path
      const parentDeck = decks.find(d => d.path === deck.parentPath);
      if (parentDeck) {
        const parentItem = deckMap.get(parentDeck.id);
        if (parentItem) {
          parentItem.children.push(item);
        }
      }
    } else {
      roots.push(item);
    }
  }

  return roots;
}

const deckTree = computed(() => buildDeckTree(deckStore.allDecks));

// Check if a deck is selected
function isDeckSelected(deckPath: string): boolean {
  if (route.path.startsWith('/decks/')) {
    const currentPath = '/' + decodeURIComponent(route.params.id as string);
    return currentPath === deckPath || currentPath.startsWith(deckPath + '/');
  }
  return false;
}

// Dark mode
const isDark = ref(false);

function initTheme() {
  const saved = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (saved === 'dark' || (!saved && prefersDark)) {
    document.documentElement.classList.add('dark');
  }
  isDark.value = document.documentElement.classList.contains('dark');
}

onMounted(() => {
  initTheme();
});

function toggleDarkMode() {
  const html = document.documentElement;
  if (html.classList.contains('dark')) {
    html.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  } else {
    html.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  }
  isDark.value = html.classList.contains('dark');
}

// Modal state
const showCardModal = ref(false);
const showCreateDeckModal = ref(false);
const newDeckName = ref('');
const selectedParentPath = ref<string | null>(null);

function startQuickReview() {
  router.push('/review');
}

function navigateTo(path: string) {
  router.push(path);
}

function openCardModal() {
  showCardModal.value = true;
}

function handleCardSaved() {
  // Card was saved successfully
}

function openCreateDeckModal() {
  newDeckName.value = '';
  selectedParentPath.value = null;
  showCreateDeckModal.value = true;
}

function createDeck() {
  if (!newDeckName.value.trim()) return;
  deckStore.createDeck(newDeckName.value.trim(), selectedParentPath.value);
  newDeckName.value = '';
  selectedParentPath.value = null;
  showCreateDeckModal.value = false;
}
</script>

<template>
  <aside class="sidebar">
    <!-- Main Navigation -->
    <nav class="nav-section">
      <button @click="navigateTo('/')" class="nav-item">
        <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        <span>Home</span>
      </button>

      <button @click="navigateTo('/decks')" class="nav-item">
        <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
        </svg>
        <span>Decks</span>
        <span v-if="dueCount > 0" class="nav-badge">{{ dueCount }}</span>
      </button>

      <button @click="startQuickReview" class="nav-item">
        <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        <span>Review</span>
        <span v-if="dueCount > 0" class="nav-badge due-badge">{{ dueCount }}</span>
      </button>

      <button @click="openCardModal" class="nav-item">
        <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        <span>Add Card</span>
      </button>
    </nav>

    <!-- Decks Section -->
    <div class="decks-section">
      <div class="section-header">
        <span>Decks</span>
      </div>
      <div class="decks-tree">
        <DeckTreeItem
          v-for="item in deckTree"
          :key="item.deck.id"
          :item="item"
          :is-selected="isDeckSelected(item.deck.path)"
        />
        <div v-if="deckStore.allDecks.length === 0" class="no-decks">
          No decks yet
        </div>
      </div>
      <button @click="openCreateDeckModal" class="new-deck-btn">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        <span>New Deck</span>
      </button>
    </div>

    <!-- Bottom Actions -->
    <div class="bottom-section">
      <button @click="navigateTo('/settings')" class="nav-item">
        <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span>Settings</span>
      </button>

      <button @click="toggleDarkMode" class="nav-item theme-toggle">
        <svg v-if="isDark" class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <svg v-else class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
        <span>{{ isDark ? 'Light Mode' : 'Dark Mode' }}</span>
      </button>
    </div>

    <!-- Card Modal -->
    <CardModal
      v-model="showCardModal"
      @saved="handleCardSaved"
    />

    <!-- Create Deck Modal -->
    <Teleport to="body">
      <div v-if="showCreateDeckModal" class="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-black/50" @click="showCreateDeckModal = false"></div>
        <div class="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6">
          <h2 class="text-xl font-bold mb-4 dark:text-white">Create New Deck</h2>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-1 dark:text-gray-300">Deck Name</label>
              <input
                v-model="newDeckName"
                type="text"
                class="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="e.g., Japanese Vocabulary"
                @keyup.enter="createDeck"
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-1 dark:text-gray-300">Parent Deck (optional)</label>
              <select
                v-model="selectedParentPath"
                class="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option :value="null">No parent (root deck)</option>
                <option v-for="deck in deckStore.allDecks" :key="deck.id" :value="deck.path">
                  {{ deck.path }}
                </option>
              </select>
            </div>
          </div>

          <div class="flex justify-end gap-2 mt-6">
            <button
              @click="showCreateDeckModal = false"
              class="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100-700 rounded-lg dark:hover:bg-gray transition-colors"
            >
              Cancel
            </button>
            <button
              @click="createDeck"
              :disabled="!newDeckName.trim()"
              class="px-4 py-2 text-sm bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              Create Deck
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 280px;
  height: 100vh;
  background: #faf9f7;
  color: #1a1a2e;
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 100;
}

.dark .sidebar {
  background: #1a1a2e;
  color: #fff;
}

.nav-section {
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 10px;
  color: #6b6b6b;
  transition: all 0.2s ease;
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
}

.nav-item:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #1a1a2e;
}

.dark .nav-item {
  color: rgba(255, 255, 255, 0.7);
}

.dark .nav-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.nav-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.nav-badge {
  margin-left: auto;
  background: #ed751c;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
}

.due-badge {
  background: #ef4444;
}

.decks-section {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 8px 12px;
  min-height: 0;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 4px;
  margin-bottom: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #6b6b6b;
}

.dark .section-header {
  color: rgba(255, 255, 255, 0.4);
}

.decks-tree {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.no-decks {
  padding: 12px;
  font-size: 13px;
  color: #9ca3af;
  text-align: center;
}

.dark .no-decks {
  color: #6b7280;
}

.new-deck-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  margin-top: 8px;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
  border-radius: 8px;
  color: #6b6b6b;
  font-size: 13px;
  transition: all 0.2s;
}

.new-deck-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #1a1a2e;
}

.dark .new-deck-btn {
  color: rgba(255, 255, 255, 0.7);
}

.dark .new-deck-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.bottom-section {
  padding: 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.dark .bottom-section {
  border-top-color: rgba(255, 255, 255, 0.1);
}

.theme-toggle {
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.dark .theme-toggle {
  border-top-color: rgba(255, 255, 255, 0.05);
}
</style>
