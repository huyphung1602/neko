<template>
  <div class="flex flex-col">
    <button
      @click="selectDeck"
      class="flex items-center gap-1.5 px-2 py-1 border-none bg-none w-full text-left cursor-pointer rounded transition-all duration-150 text-xs"
      :class="[
        isSelected
          ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
          : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/30 hover:text-gray-700 dark:hover:text-gray-200'
      ]"
      :style="{ paddingLeft: `${8 + level * 12}px` }"
    >
      <div class="flex items-center justify-center w-3 flex-shrink-0">
        <button
          v-if="hasChildren"
          @click.stop="toggleExpand"
          class="p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <svg
            class="w-3 h-3 transition-transform duration-150"
            :class="{ 'rotate-90': isExpanded }"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <span v-else class="w-3" />
      </div>

      <svg class="w-3.5 h-3.5 flex-shrink-0 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>

      <span class="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">{{ item.deck.name }}</span>
    </button>

    <div v-if="hasChildren && isExpanded" class="flex flex-col">
      <DeckTreeItem
        v-for="child in item.children"
        :key="child.deck.path"
        :item="child"
        :level="level + 1"
        :isSelected="isDeckSelected()"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';

interface DeckTreeItemData {
  deck: { path: string; name: string; parentPath: string | null };
  children: DeckTreeItemData[];
}

const props = defineProps<{
  item: DeckTreeItemData;
  level?: number;
  isSelected?: boolean;
}>();

const router = useRouter();
const expandedIds = ref<Set<string>>(new Set());

const hasChildren = computed(() => props.item.children.length > 0);
const isExpanded = computed(() => expandedIds.value.has(props.item.deck.path));
const level = computed(() => props.level || 0);

function isDeckSelected(): boolean {
  return props.isSelected || false;
}

function toggleExpand(e: Event) {
  e.stopPropagation();
  if (!hasChildren.value) return;
  if (expandedIds.value.has(props.item.deck.path)) {
    expandedIds.value.delete(props.item.deck.path);
  } else {
    expandedIds.value.add(props.item.deck.path);
  }
}

function selectDeck() {
  const cleanPath = props.item.deck.path.startsWith('/')
    ? props.item.deck.path.slice(1)
    : props.item.deck.path;
  router.push(`/decks/${encodeURIComponent(cleanPath)}`);
}
</script>
