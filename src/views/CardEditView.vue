<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useCardStore } from '@/stores/card';
import { useDeckStore } from '@/stores/deck';

const route = useRoute();
const router = useRouter();
const cardStore = useCardStore();
const deckStore = useDeckStore();

const cardId = computed(() => route.params.id as string | null);
const isEditing = computed(() => !!cardId.value);

const deckId = ref('');
const front = ref('');
const back = ref('');
const tags = ref('');
const isFrontPreview = ref(false);
const isBackPreview = ref(false);

const renderedFront = computed(() => cardStore.renderMarkdown(front.value));
const renderedBack = computed(() => cardStore.renderMarkdown(back.value));

const allDecks = computed(() => deckStore.allDecks);

onMounted(() => {
  // Set default deck from query param
  const queryDeck = route.query.deck as string;
  if (queryDeck) {
    deckId.value = queryDeck;
  } else if (allDecks.value.length > 0) {
    deckId.value = allDecks.value[0].path;
  }

  // Load existing card if editing
  if (isEditing.value && cardId.value) {
    const card = cardStore.getCard(cardId.value);
    if (card) {
      deckId.value = card.deckPath;
      front.value = card.front;
      back.value = card.back;
      tags.value = card.tags.join(', ');
    }
  }
});

async function saveCard() {
  if (!deckId.value || !front.value.trim()) return;

  const tagList = tags.value
    .split(',')
    .map(t => t.trim())
    .filter(Boolean);

  if (isEditing.value && cardId.value) {
    await cardStore.updateCard(cardId.value, {
      front: front.value,
      back: back.value,
      tags: tagList
    });
  } else {
    await cardStore.createCard(deckId.value, front.value, back.value, tagList);
  }

  router.back();
}

function cancel() {
  router.back();
}

const insertMarkdown = (syntax: string, placeholder = '') => {
  const textarea = document.getElementById(syntax === 'bold' ? 'front-input' : 'back-input') as HTMLTextAreaElement;
  if (!textarea) return;

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = textarea.value;
  const selection = text.substring(start, end) || placeholder;

  let newText = '';
  let cursorPos = start;

  switch (syntax) {
    case 'bold':
      newText = text.substring(0, start) + `**${selection}**` + text.substring(end);
      cursorPos = start + 2 + selection.length;
      break;
    case 'italic':
      newText = text.substring(0, start) + `_${selection}_` + text.substring(end);
      cursorPos = start + 1 + selection.length;
      break;
    case 'code':
      newText = text.substring(0, start) + `\`${selection}\`` + text.substring(end);
      cursorPos = start + 1 + selection.length;
      break;
    case 'list':
      newText = text.substring(0, start) + `- ${selection}` + text.substring(end);
      cursorPos = start + 2 + selection.length;
      break;
  }

  if (syntax === 'bold' || syntax === 'italic' || syntax === 'code') {
    front.value = newText;
    back.value = newText;
  } else if (syntax === 'bold') {
    front.value = newText;
  } else {
    back.value = newText;
  }

  // Focus and set cursor
  setTimeout(() => {
    textarea.focus();
    textarea.setSelectionRange(cursorPos, cursorPos);
  }, 0);
};
</script>

<template>
  <div class="h-full flex flex-col dark:bg-gray-900 dark:text-white">
    <header class="p-6 border-b border-neko-border dark:border-gray-700 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold dark:text-white">{{ isEditing ? 'Edit Card' : 'New Card' }}</h1>
        <p class="text-neko-muted dark:text-gray-400">Create a flashcard with front and back content</p>
      </div>
      <div class="flex gap-2">
        <button @click="cancel" class="btn btn-secondary dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600">Cancel</button>
        <button @click="saveCard" class="btn btn-primary" :disabled="!deckId || !front.trim()">
          Save Card
        </button>
      </div>
    </header>

    <div class="flex-1 overflow-y-auto">
      <div class="p-6 max-w-4xl mx-auto space-y-6">
        <!-- Deck Selection -->
        <div>
          <label class="block text-sm font-medium mb-1 dark:text-gray-300">Deck</label>
          <select v-model="deckId" class="input dark:bg-gray-800 dark:border-gray-700 dark:text-white">
            <option value="" disabled>Select a deck</option>
            <option v-for="deck in allDecks" :key="deck.path" :value="deck.path">
              {{ deck.path }}
            </option>
          </select>
        </div>

        <!-- Front (Question) -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="text-sm font-medium dark:text-gray-300">Front (Question)</label>
            <div class="flex gap-1">
              <button @click="isFrontPreview = !isFrontPreview" class="btn-ghost text-xs dark:text-gray-400 dark:hover:bg-gray-700">
                {{ isFrontPreview ? 'Edit' : 'Preview' }}
              </button>
            </div>
          </div>

          <div v-if="isFrontPreview" class="card p-4 min-h-[120px] markdown-content dark:bg-gray-800 dark:border-gray-700" v-html="renderedFront"></div>
          <div v-else class="relative">
            <div class="flex gap-1 mb-2">
              <button @click="insertMarkdown('bold')" class="btn-ghost text-xs px-2 py-1 dark:text-gray-400 dark:hover:bg-gray-700">Bold</button>
              <button @click="insertMarkdown('italic')" class="btn-ghost text-xs px-2 py-1 dark:text-gray-400 dark:hover:bg-gray-700">Italic</button>
              <button @click="insertMarkdown('code')" class="btn-ghost text-xs px-2 py-1 dark:text-gray-400 dark:hover:bg-gray-700">Code</button>
              <button @click="insertMarkdown('list')" class="btn-ghost text-xs px-2 py-1 dark:text-gray-400 dark:hover:bg-gray-700">List</button>
            </div>
            <textarea
              id="front-input"
              v-model="front"
              class="input min-h-[120px] font-mono text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400"
              placeholder="Enter the question or prompt..."
            ></textarea>
          </div>
        </div>

        <!-- Back (Answer) -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="text-sm font-medium dark:text-gray-300">Back (Answer)</label>
            <div class="flex gap-1">
              <button @click="isBackPreview = !isBackPreview" class="btn-ghost text-xs dark:text-gray-400 dark:hover:bg-gray-700">
                {{ isBackPreview ? 'Edit' : 'Preview' }}
              </button>
            </div>
          </div>

          <div v-if="isBackPreview" class="card p-4 min-h-[120px] markdown-content dark:bg-gray-800 dark:border-gray-700" v-html="renderedBack"></div>
          <div v-else>
            <div class="flex gap-1 mb-2">
              <button @click="insertMarkdown('bold', 'back')" class="btn-ghost text-xs px-2 py-1 dark:text-gray-400 dark:hover:bg-gray-700">Bold</button>
              <button @click="insertMarkdown('italic', 'back')" class="btn-ghost text-xs px-2 py-1 dark:text-gray-400 dark:hover:bg-gray-700">Italic</button>
              <button @click="insertMarkdown('code', 'back')" class="btn-ghost text-xs px-2 py-1 dark:text-gray-400 dark:hover:bg-gray-700">Code</button>
              <button @click="insertMarkdown('list', 'back')" class="btn-ghost text-xs px-2 py-1 dark:text-gray-400 dark:hover:bg-gray-700">List</button>
            </div>
            <textarea
              id="back-input"
              v-model="back"
              class="input min-h-[120px] font-mono text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400"
              placeholder="Enter the answer..."
            ></textarea>
          </div>
        </div>

        <!-- Tags -->
        <div>
          <label class="block text-sm font-medium mb-1 dark:text-gray-300">Tags (comma separated)</label>
          <input
            v-model="tags"
            type="text"
            class="input dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400"
            placeholder="e.g., japanese, vocabulary, n5"
          />
        </div>

        <!-- Preview Both -->
        <div class="border-t border-neko-border dark:border-gray-700 pt-6">
          <h3 class="text-sm font-medium mb-4 dark:text-gray-300">Card Preview</h3>
          <div class="grid md:grid-cols-2 gap-4">
            <div class="card p-4 dark:bg-gray-800 dark:border-gray-700">
              <div class="text-xs font-medium text-neko-muted dark:text-gray-400 mb-2">FRONT</div>
              <div class="markdown-content dark:text-white" v-html="renderedFront"></div>
            </div>
            <div class="card p-4 dark:bg-gray-800 dark:border-gray-700">
              <div class="text-xs font-medium text-neko-muted dark:text-gray-400 mb-2">BACK</div>
              <div class="markdown-content dark:text-white" v-html="renderedBack"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
