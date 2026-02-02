<template>
  <div class="flex flex-col">
    <div class="flex items-center" :style="{ paddingLeft: `${level * 12 + 8}px` }">
      <!-- Left part: expand toggle + icon + name -->
      <div class="flex items-center gap-1.5 py-1 flex-1 min-w-0">
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

        <button
          @click="selectDeck"
          class="flex-1 min-w-0 text-left cursor-pointer rounded transition-all duration-150 text-xs truncate"
          :class="[
            isSelected
              ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          ]"
        >
          {{ item.deck.name }}
        </button>
      </div>

      <!-- Right part: menu button -->
      <button
        @click.stop="toggleMenu"
        class="w-6 h-6 flex items-center justify-center mr-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-all flex-shrink-0"
      >
        <svg class="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01" />
        </svg>
      </button>
    </div>

    <!-- Context Menu -->
    <Teleport to="body">
      <div
        v-if="showMenu"
        class="fixed z-[200] w-[140px] bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        :style="{ top: `${menuPosition.top}px`, left: `${menuPosition.left}px` }"
        @click.stop
      >
        <button
          @click="openDeck"
          class="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          View Cards
        </button>
      </div>
    </Teleport>

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
import { ref, computed, onMounted, onUnmounted } from 'vue';
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
const showMenu = ref(false);
const menuPosition = ref({ top: 0, left: 0 });

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
  openDeck();
}

function openDeck() {
  const cleanPath = props.item.deck.path.startsWith('/')
    ? props.item.deck.path.slice(1)
    : props.item.deck.path;
  router.push(`/decks/${encodeURIComponent(cleanPath)}`);
  closeMenu();
}

function toggleMenu(e: Event) {
  e.stopPropagation();
  if (showMenu.value) {
    closeMenu();
    return;
  }

  const button = e.currentTarget as HTMLElement;
  const rect = button.getBoundingClientRect();
  showMenu.value = true;
  menuPosition.value = {
    top: rect.bottom + 4,
    left: rect.right - 140 // Menu width is 140px
  };
}

function closeMenu() {
  showMenu.value = false;
}

function handleClickOutside(e: Event) {
  const target = e.target as HTMLElement;
  if (!target.closest('.fixed.z-\\[200\\]')) {
    closeMenu();
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>
