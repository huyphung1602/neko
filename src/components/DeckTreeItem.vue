<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';

interface DeckTreeItem {
  deck: { id: string; path: string; name: string; parentPath: string | null; lastModified: number };
  children: DeckTreeItem[];
}

const props = defineProps<{
  item: DeckTreeItem;
  level?: number;
  isSelected?: boolean;
}>();

const router = useRouter();
const expandedIds = ref<Set<string>>(new Set());

const hasChildren = computed(() => props.item.children.length > 0);
const isExpanded = computed(() => expandedIds.value.has(props.item.deck.id));
const level = computed(() => props.level || 0);

function toggleExpand(e: Event) {
  e.stopPropagation();
  if (!hasChildren.value) return;
  if (expandedIds.value.has(props.item.deck.id)) {
    expandedIds.value.delete(props.item.deck.id);
  } else {
    expandedIds.value.add(props.item.deck.id);
  }
}

function selectDeck() {
  const cleanPath = props.item.deck.path.startsWith('/')
    ? props.item.deck.path.slice(1)
    : props.item.deck.path;
  router.push(`/decks/${encodeURIComponent(cleanPath)}`);
}
</script>

<template>
  <div class="deck-tree-item">
    <button
      @click="selectDeck"
      class="deck-button"
      :class="{ 'selected': isSelected }"
      :style="{ paddingLeft: `${12 + level * 16}px` }"
    >
      <div class="arrow-container">
        <button
          v-if="hasChildren"
          @click="toggleExpand"
          class="expand-btn"
        >
          <svg
            class="w-4 h-4 transition-transform"
            :class="{ 'rotate-90': isExpanded }"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <span v-else class="w-4" />
      </div>

      <svg class="deck-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>

      <span class="deck-name">{{ item.deck.name }}</span>
    </button>

    <div v-if="hasChildren && isExpanded" class="nested-children">
      <DeckTreeItem
        v-for="child in item.children"
        :key="child.deck.id"
        :item="child"
        :level="level + 1"
        :is-selected="isSelected"
      />
    </div>
  </div>
</template>

<style scoped>
.deck-tree-item {
  display: flex;
  flex-direction: column;
}

.deck-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  padding-right: 8px;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
  border-radius: 6px;
  color: #6b6b6b;
  transition: all 0.2s;
  font-size: 13px;
}

.deck-button:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #1a1a2e;
}

.dark .deck-button {
  color: rgba(255, 255, 255, 0.7);
}

.dark .deck-button:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.deck-button.selected {
  background: rgba(0, 0, 0, 0.05);
  color: #1a1a2e;
}

.dark .deck-button.selected {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.arrow-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  flex-shrink: 0;
}

.expand-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  color: inherit;
  border-radius: 4px;
}

.expand-btn:hover {
  background: rgba(0, 0, 0, 0.1);
}

.dark .expand-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.deck-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  opacity: 0.6;
}

.deck-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nested-children {
  display: flex;
  flex-direction: column;
}
</style>
