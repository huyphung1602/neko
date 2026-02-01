// Card metadata store - tracks review counts per card
import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface CardMetadata {
  reviewCount: number;
  lastReviewDate: string;
}

export const useMetadataStore = defineStore('metadata', () => {
  const metadata = ref<Record<string, CardMetadata>>({});
  const isLoading = ref(false);

  async function loadMetadata(): Promise<void> {
    isLoading.value = true;
    try {
      if (typeof window !== 'undefined' && 'nekos' in window) {
        const data = await window.nekos.readCardMetadata();
        metadata.value = data || {};
        console.log('[MetadataStore] Loaded metadata for', Object.keys(metadata.value).length, 'cards');
      }
    } catch (e) {
      console.error('Failed to load metadata:', e);
    } finally {
      isLoading.value = false;
    }
  }

  function getReviewCount(cardId: string): number {
    return metadata.value[cardId]?.reviewCount || 0;
  }

  async function incrementReviewCount(cardId: string): Promise<void> {
    const current = metadata.value[cardId]?.reviewCount || 0;
    const newCount = current + 1;

    metadata.value[cardId] = {
      reviewCount: newCount,
      lastReviewDate: new Date().toISOString()
    };

    try {
      if (typeof window !== 'undefined' && 'nekos' in window) {
        await window.nekos.updateCardMetadata({
          cardId,
          reviewCount: newCount
        });
      }
    } catch (e) {
      console.error('Failed to update metadata:', e);
    }
  }

  return {
    metadata,
    isLoading,
    loadMetadata,
    getReviewCount,
    incrementReviewCount
  };
});
