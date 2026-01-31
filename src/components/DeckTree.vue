<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useDeckStore } from '@/stores/deck';
import DeckTreeItem from './DeckTreeItem.vue';

interface DeckTreeItem {
  deck: { id: string; path: string; name: string; parentPath: string | null; lastModified: number };
  children: DeckTreeItem[];
  cardCount: number;
}

const router = useRouter();
const deckStore = useDeckStore();

const expandedIds = ref<Set<string>>(new Set());

const treeItems = computed(() => deckStore.deckTreeItems() as DeckTreeItem[]);

function toggleExpand(id: string) {
  if (expandedIds.value.has(id)) {
    expandedIds.value.delete(id);
  } else {
    expandedIds.value.add(id);
  }
}

function isExpanded(id: string): boolean {
  return expandedIds.value.has(id);
}

function selectDeck(id: string) {
  router.push(`/decks/${id}`);
}
</script>

<template>
  <div class="mt-2">
    <div v-for="item in treeItems" :key="item.deck.id" class="deck-item">
      <button
        @click="selectDeck(item.deck.id)"
        class="deck-button"
        :class="{ 'pl-6': item.deck.parentPath }"
      >
        <button
          v-if="item.children.length > 0"
          @click.stop="toggleExpand(item.deck.id)"
          class="expand-btn"
        >
          <svg
            class="w-4 h-4 transition-transform"
            :class="{ 'rotate-90': isExpanded(item.deck.id) }"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <span v-else class="w-4" />

        <div class="flex items-center gap-2 flex-1 min-w-0">
          <span class="truncate text-sm dark:text-gray-300">{{ item.deck.name }}</span>
          <span v-if="item.cardCount > 0" class="badge badge-gray dark:bg-gray-700 dark:text-gray-300 text-xs">
            {{ item.cardCount }}
          </span>
        </div>
      </button>

      <div v-if="item.children.length > 0 && isExpanded(item.deck.id)" class="nested-children">
        <DeckTreeItem
          v-for="child in item.children"
          :key="child.deck.id"
          :item="child"
        />
      </div>
    </div>

    <div v-if="treeItems.length === 0" class="text-sm text-neko-muted dark:text-gray-500 px-2 py-2">
      No decks yet
    </div>
  </div>
</template>

<style scoped>
.deck-button {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 6px 10px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  text-align: left;
  color: #1a1a2e;
  transition: all 0.15s ease;
}

.deck-button:hover {
  background: rgba(0, 0, 0, 0.04);
}

.dark .deck-button {
  color: rgba(255, 255, 255, 0.9);
}

.dark .deck-button:hover {
  background: rgba(255, 255, 255, 0.08);
}

.expand-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  color: #6b6b6b;
  border-radius: 4px;
  transition: all 0.15s ease;
}

.expand-btn:hover {
  background: rgba(0, 0, 0, 0.06);
}

.dark .expand-btn {
  color: rgba(255, 255, 255, 0.6);
}

.dark .expand-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.nested-children {
  margin-left: 12px;
  padding-left: 4px;
  border-left: 1px solid #e5e5e5;
}

.dark .nested-children {
  border-left-color: #374151;
}
</style>
