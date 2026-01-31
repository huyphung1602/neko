// Workspace store - IndexedDB as single source of truth
// Simple and fast - no folder selection needed
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { fileSystemSync, type StorageType } from '@/utils/fileSystem';

export const useWorkspaceStore = defineStore('workspace', () => {
  const storageType = ref<StorageType>('memory');
  const isLoading = ref(false);
  const isInitialized = ref(false);

  // Always ready after init
  const isReady = computed(() => isInitialized.value);

  async function init(): Promise<void> {
    if (isInitialized.value) return;

    isLoading.value = true;
    try {
      await fileSystemSync.init();
      storageType.value = fileSystemSync.getStorageType();

      // Initialize OPFS if available
      if (storageType.value === 'opfs') {
        await fileSystemSync.initOPFS('neko');
      }
    } catch (e) {
      console.error('Failed to initialize workspace:', e);
    } finally {
      isLoading.value = false;
      isInitialized.value = true;
    }
  }

  return {
    storageType,
    isLoading,
    isInitialized,
    isReady,
    init
  };
});
