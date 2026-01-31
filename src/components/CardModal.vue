<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { useCardStore } from '@/stores/card';
import { useDeckStore } from '@/stores/deck';

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

const front = ref('');
const back = ref('');
const deckPath = ref('');

const allDecks = computed(() => deckStore.allDecks);
const isEditing = computed(() => !!props.editCardId);
const existingCard = computed(() => props.editCardId ? cardStore.getCard(props.editCardId) : null);

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    nextTick(() => {
      // Focus front textarea
      const frontEl = document.querySelector<HTMLTextAreaElement>('#front-textarea');
      frontEl?.focus();
    });

    // Set deck from prop or default
    if (props.initialDeck) {
      deckPath.value = props.initialDeck;
    } else if (allDecks.value.length > 0 && !deckPath.value) {
      deckPath.value = allDecks.value[0].path;
    }

    // Load existing card for editing
    if (existingCard.value) {
      deckPath.value = existingCard.value.deckPath;
      front.value = existingCard.value.front;
      back.value = existingCard.value.back;
    } else {
      front.value = '';
      back.value = '';
    }
  }
});

async function saveCard() {
  if (!deckPath.value || !front.value.trim()) return;

  const tagList: string[] = [];

  if (isEditing.value && props.editCardId) {
    await cardStore.updateCard(props.editCardId, {
      front: front.value,
      back: back.value,
      tags: tagList,
      deckPath: deckPath.value
    });
  } else {
    await cardStore.createCard(deckPath.value, front.value, back.value, tagList);
  }

  emit('saved');
  close();
}

function close() {
  emit('update:modelValue', false);
}

function handleKeydown(e: KeyboardEvent) {
  // Escape to close
  if (e.key === 'Escape') {
    close();
  }
  // Ctrl+Enter to save
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    saveCard();
  }
  // Ctrl+B for bold
  if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
    e.preventDefault();
    wrapSelection('**', '**');
  }
  // Ctrl+I for italic
  if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
    e.preventDefault();
    wrapSelection('_', '_');
  }
}

function wrapSelection(before: string, after: string) {
  const activeEl = document.activeElement as HTMLTextAreaElement;
  if (!activeEl || activeEl.tagName !== 'TEXTAREA') return;

  const start = activeEl.selectionStart;
  const end = activeEl.selectionEnd;
  const selection = activeEl.value.substring(start, end);

  const isFront = activeEl.id === 'front-textarea';
  if (isFront) {
    front.value = activeEl.value.substring(0, start) + before + selection + after + activeEl.value.substring(end);
  } else {
    back.value = activeEl.value.substring(0, start) + before + selection + after + activeEl.value.substring(end);
  }

  nextTick(() => {
    activeEl.focus();
    activeEl.setSelectionRange(start + before.length, start + before.length + selection.length);
  });
}
</script>

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
      <div class="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl overflow-hidden flex flex-col" style="max-height: 90vh;">
        <!-- Header with deck selector -->
        <div class="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <select
              v-model="deckPath"
              class="text-sm bg-transparent border-0 focus:ring-0 p-0 text-gray-700 dark:text-gray-200 font-medium cursor-pointer"
            >
              <option v-for="deck in allDecks" :key="deck.path" :value="deck.path">
                {{ deck.name }}
              </option>
            </select>
          </div>
          <button
            @click="close"
            class="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Editor Content -->
        <div class="flex-1 overflow-y-auto p-4 space-y-3">
          <!-- Front -->
          <textarea
            id="front-textarea"
            v-model="front"
            class="w-full resize-none focus:outline-none text-gray-900 dark:text-white bg-transparent font-mono text-sm leading-relaxed"
            style="min-height: 80px;"
            placeholder="Front side..."
          ></textarea>

          <!-- Divider line -->
          <div class="border-t border-gray-200 dark:border-gray-700"></div>

          <!-- Back -->
          <textarea
            id="back-textarea"
            v-model="back"
            class="w-full resize-none focus:outline-none text-gray-900 dark:text-white bg-transparent font-mono text-sm leading-relaxed"
            style="min-height: 80px;"
            placeholder="Back side..."
          ></textarea>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-between p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div class="text-xs text-gray-400 dark:text-gray-500">
            <span v-if="!front.trim()" class="text-red-500">Front required</span>
            <span v-else class="text-green-600 dark:text-green-400">Ready</span>
          </div>
          <div class="flex gap-2">
            <button
              @click="close"
              class="px-4 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            >
              Cancel
            </button>
            <button
              @click="saveCard"
              :disabled="!front.trim()"
              class="px-4 py-1.5 text-sm bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded transition-colors font-medium"
            >
              {{ isEditing ? 'Update' : 'Create' }}
            </button>
          </div>
        </div>

        <!-- Shortcuts hint -->
        <div class="px-4 py-2 text-xs text-center text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
          <span class="hidden sm:inline">Ctrl+B bold</span>
          <span class="hidden sm:inline mx-2">|</span>
          <span class="hidden sm:inline">Ctrl+I italic</span>
          <span class="hidden sm:inline mx-2">|</span>
          <span>Ctrl+Enter to save</span>
        </div>
      </div>
    </div>
  </Teleport>
</template>
