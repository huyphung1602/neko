<template>
  <aside class="w-[240px] h-screen bg-[#faf9f7] dark:bg-[#1a1a2e] text-[#1a1a2e] dark:text-white flex flex-col fixed left-0 top-0 z-100">
    <!-- Main Navigation -->
    <nav class="p-2 flex flex-col gap-0.5">
      <button @click="navigateTo('/')" class="nav-item">
        <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        <span>Home</span>
      </button>

      <button @click="navigateTo('/decks')" class="nav-item">
        <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
        </svg>
        <span>Decks</span>
        <span v-if="dueCount > 0" class="ml-auto text-[10px] bg-[#ed751c] text-white font-semibold px-1.5 py-0.5 rounded-full">{{ dueCount }}</span>
      </button>

      <button @click="startQuickReview" class="nav-item">
        <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        <span>Review</span>
        <span v-if="dueCount > 0" class="ml-auto text-[10px] bg-red-500 text-white font-semibold px-1.5 py-0.5 rounded-full">{{ dueCount }}</span>
      </button>

      <button @click="openCardModal" class="nav-item">
        <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        <span>Add Card</span>
      </button>
    </nav>

    <!-- Decks Section -->
    <div class="flex-1 flex flex-col overflow-hidden px-2 py-1 min-h-0">
      <div class="flex items-center justify-between px-2 py-1.5">
        <span class="text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Decks</span>
      </div>
      <div class="flex-1 overflow-y-auto flex flex-col">
        <DeckTreeItem
          v-for="item in deckTree"
          :key="item.deck.path"
          :item="item"
          :isSelected="isDeckSelected(item.deck.path)"
        />
        <div v-if="deckStore.allDecks.length === 0" class="px-2 py-2 text-xs text-center text-gray-400">
          No decks
        </div>
      </div>
      <button @click="openCreateDeckModal" class="flex items-center gap-1.5 px-2 py-1.5 mt-1 border-none bg-none w-full text-left cursor-pointer rounded text-xs transition-all duration-200 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        <span>New Deck</span>
      </button>
    </div>

    <!-- Bottom Actions -->
    <div class="p-2 border-t border-gray-200 dark:border-gray-700">
      <button @click="changeWorkspace" class="nav-item">
        <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
        <span>Change Workspace</span>
      </button>

      <button @click="toggleDarkMode" class="nav-item">
        <svg v-if="isDark" class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <svg v-else class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
        <span>{{ isDark ? 'Light' : 'Dark' }}</span>
      </button>
    </div>

    <!-- Card Modal -->
    <CardModal v-model="showCardModal" @saved="handleCardSaved" />

    <!-- Create Deck Modal -->
    <Teleport to="body">
      <div v-if="showCreateDeckModal" class="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-black/50" @click="showCreateDeckModal = false"></div>
        <div class="relative w-full max-w-sm bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4">
          <h2 class="text-base font-semibold mb-3 dark:text-white">New Deck</h2>

          <div class="space-y-3">
            <div>
              <label class="block text-xs font-medium mb-1 dark:text-gray-300">Name</label>
              <input
                v-model="newDeckName"
                type="text"
                class="w-full px-2 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
                placeholder="Deck name"
                @keyup.enter="createDeck"
              />
            </div>
          </div>

          <div class="flex justify-end gap-2 mt-4">
            <button
              @click="showCreateDeckModal = false"
              class="px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            >
              Cancel
            </button>
            <button
              @click="createDeck"
              :disabled="!newDeckName.trim()"
              class="px-3 py-1.5 text-xs bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded transition-colors"
            >
              Create
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useCardStore } from '@/stores/card';
import { useDeckStore } from '@/stores/deck';
import { useWorkspaceStore } from '@/stores/workspace';
import CardModal from '@/components/CardModal.vue';
import DeckTreeItem from '@/components/DeckTreeItem.vue';

const router = useRouter();
const route = useRoute();
const cardStore = useCardStore();
const deckStore = useDeckStore();
const workspaceStore = useWorkspaceStore();

const dueCount = computed(() => cardStore.getDueCardsCount());

interface DeckTreeNode {
  deck: { path: string; name: string; parentPath: string | null };
  children: DeckTreeNode[];
}

function buildDeckTree(decks: typeof deckStore.allDecks): DeckTreeNode[] {
  const deckMap = new Map<string, DeckTreeNode>();
  const roots: DeckTreeNode[] = [];

  for (const deck of decks) {
    deckMap.set(deck.path, { deck: deck as any, children: [] });
  }

  for (const deck of decks) {
    const item = deckMap.get(deck.path)!;
    if (deck.parentPath) {
      const parentDeck = decks.find(d => d.path === deck.parentPath);
      if (parentDeck) {
        const parentItem = deckMap.get(parentDeck.path);
        if (parentItem) parentItem.children.push(item);
      }
    } else {
      roots.push(item);
    }
  }

  return roots;
}

const deckTree = computed(() => buildDeckTree(deckStore.allDecks));

function isDeckSelected(deckPath: string): boolean {
  if (route.path.startsWith('/decks/')) {
    const currentPath = '/' + decodeURIComponent(route.params.id as string);
    return currentPath === deckPath || currentPath.startsWith(deckPath + '/');
  }
  return false;
}

const isDark = ref(false);

function initTheme() {
  const saved = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (saved === 'dark' || (!saved && prefersDark)) {
    document.documentElement.classList.add('dark');
  }
  isDark.value = document.documentElement.classList.contains('dark');
}

onMounted(() => initTheme());

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

async function changeWorkspace() {
  await workspaceStore.selectWorkspace();
  if (workspaceStore.workspacePath) {
    router.go(0);
  }
}

const showCardModal = ref(false);
const showCreateDeckModal = ref(false);
const newDeckName = ref('');

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
  router.go(0);
}

function openCreateDeckModal() {
  newDeckName.value = '';
  showCreateDeckModal.value = true;
}

async function createDeck() {
  if (!newDeckName.value.trim() || !workspaceStore.workspacePath) return;

  await deckStore.createDeck(newDeckName.value.trim());
  newDeckName.value = '';
  showCreateDeckModal.value = false;
  router.go(0);
}
</script>

<style scoped>
.nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 6px;
  color: #6b6b6b;
  transition: all 0.15s ease;
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 12px;
}

.nav-item:hover {
  background: rgba(0, 0, 0, 0.04);
  color: #1a1a2e;
}

.dark .nav-item {
  color: rgba(255, 255, 255, 0.7);
}

.dark .nav-item:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}
</style>
