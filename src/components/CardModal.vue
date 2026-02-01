<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-[200] flex items-center justify-center p-4"
      @keydown="handleKeydown"
    >
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-black/40" @click="close"></div>

      <!-- Modal -->
      <div class="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-lg shadow-xl overflow-hidden flex flex-col" style="max-height: 85vh;">
        <!-- Header with deck selector -->
        <div class="flex items-center justify-between px-3 py-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <select
              v-model="deckPath"
              class="text-xs bg-transparent border-0 focus:ring-0 p-0 text-gray-700 dark:text-gray-200 font-medium cursor-pointer"
            >
              <option v-for="deck in allDecks" :key="deck.path" :value="deck.path">
                {{ deck.name }}
              </option>
            </select>
          </div>
          <button
            @click="close"
            class="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Editor Content -->
        <div class="flex-1 overflow-y-auto p-3">
          <!-- Toolbar -->
          <div class="flex items-center gap-1 mb-2 pb-2 border-b border-gray-100 dark:border-gray-700">
            <button
              @click="insertDivider"
              class="toolbar-btn"
              title="Insert hidden side divider (---)"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Hidden Side</span>
            </button>
            <div class="w-px h-5 bg-gray-200 dark:bg-gray-600 mx-1"></div>
            <button
              @click="wrapSelection('**', '**')"
              class="toolbar-btn"
              title="Bold (Ctrl+B)"
            >
              <span class="font-bold">B</span>
            </button>
            <button
              @click="wrapSelection('_', '_')"
              class="toolbar-btn"
              title="Italic (Ctrl+I)"
            >
              <span class="italic">I</span>
            </button>
            <button
              @click="wrapSelection('`', '`')"
              class="toolbar-btn"
              title="Code"
            >
              <span class="font-mono">&lt;/&gt;</span>
            </button>
          </div>

          <!-- Content textarea -->
          <textarea
            id="content-textarea"
            v-model="content"
            class="w-full resize-none focus:outline-none text-sm text-gray-900 dark:text-white bg-transparent font-mono leading-relaxed"
            style="min-height: 200px;"
            placeholder="Enter content... Use '---' to create hidden sides."
          ></textarea>

          <!-- Hint -->
          <div class="mt-2 text-xs text-gray-400 dark:text-gray-500">
            Tip: Use <code class="px-1 bg-gray-100 dark:bg-gray-800 rounded">---</code> to separate visible and hidden content. Each hidden section will be revealed one at a time when reviewing.
          </div>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-between px-3 py-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div class="text-xs text-gray-400 dark:text-gray-500">
            <span v-if="!content.trim()" class="text-red-500">Content required</span>
            <span v-else class="text-green-600 dark:text-green-400">Ready</span>
          </div>
          <div class="flex gap-2">
            <button
              @click="close"
              class="px-3 py-1 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            >
              Cancel
            </button>
            <button
              @click="saveCard"
              :disabled="!content.trim()"
              class="px-3 py-1 text-xs bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded transition-colors font-medium"
            >
              {{ isEditing ? 'Update' : 'Create' }}
            </button>
          </div>
        </div>

        <!-- Shortcuts Hint -->
        <ShortcutsHint />
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { useCardStore } from '@/stores/card';
import { useDeckStore } from '@/stores/deck';
import ShortcutsHint from '@/components/ShortcutsHint.vue';

const props = defineProps<{
  modelValue: boolean;
  editCardId?: string | null;
  initialDeck?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'saved'): void;
}>();

const cardStore = useCardStore();
const deckStore = useDeckStore();

const content = ref('');
const deckPath = ref('');

const allDecks = computed(() => deckStore.allDecks);
const isEditing = computed(() => !!props.editCardId);
const existingCard = computed(() => props.editCardId ? cardStore.getCard(props.editCardId) : null);

function getFullContent(front: string, back: string): string {
  if (!back.trim()) return front;
  return `${front}\n---\n${back}`;
}

function splitContent(fullContent: string): { front: string; back: string } {
  const parts = fullContent.split(/\n---\n/);
  return {
    front: parts[0] || '',
    back: parts.slice(1).join('\n---\n') || ''
  };
}

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    nextTick(() => {
      const contentEl = document.querySelector<HTMLTextAreaElement>('#content-textarea');
      contentEl?.focus();
    });

    if (props.initialDeck) {
      deckPath.value = props.initialDeck;
    } else if (allDecks.value.length > 0 && !deckPath.value) {
      deckPath.value = allDecks.value[0].path;
    }

    if (existingCard.value) {
      deckPath.value = existingCard.value.deckPath;
      content.value = getFullContent(existingCard.value.front, existingCard.value.back);
    } else {
      content.value = '';
    }
  }
});

async function saveCard() {
  if (!deckPath.value || !content.value.trim()) return;

  const { front, back } = splitContent(content.value);

  if (isEditing.value && props.editCardId) {
    await cardStore.updateCard(props.editCardId, {
      front,
      back,
      deckPath: deckPath.value
    });
  } else {
    await cardStore.createCard(deckPath.value, front, back);
  }

  emit('saved');
  close();
}

function close() {
  emit('update:modelValue', false);
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    close();
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    saveCard();
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
    e.preventDefault();
    wrapSelection('**', '**');
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
    e.preventDefault();
    wrapSelection('_', '_');
  }
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === '-') {
    e.preventDefault();
    insertDivider();
  }
}

function insertDivider() {
  const activeEl = document.activeElement as HTMLTextAreaElement;
  if (!activeEl || activeEl.tagName !== 'TEXTAREA') return;

  const start = activeEl.selectionStart;
  const end = activeEl.selectionEnd;
  const divider = '\n---\n';

  content.value = activeEl.value.substring(0, start) + divider + activeEl.value.substring(end);

  nextTick(() => {
    activeEl.focus();
    activeEl.setSelectionRange(start + divider.length, start + divider.length);
  });
}

function wrapSelection(before: string, after: string) {
  const activeEl = document.activeElement as HTMLTextAreaElement;
  if (!activeEl || activeEl.tagName !== 'TEXTAREA') return;

  const start = activeEl.selectionStart;
  const end = activeEl.selectionEnd;
  const selection = activeEl.value.substring(start, end);

  content.value = activeEl.value.substring(0, start) + before + selection + after + activeEl.value.substring(end);

  nextTick(() => {
    activeEl.focus();
    activeEl.setSelectionRange(start + before.length, start + before.length + selection.length);
  });
}
</script>

<style scoped>
.toolbar-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  font-size: 11px;
  color: #6b6b6b;
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.toolbar-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #1a1a2e;
}

.dark .toolbar-btn {
  color: rgba(255, 255, 255, 0.7);
}

.dark .toolbar-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}
</style>
