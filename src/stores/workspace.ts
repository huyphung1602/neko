// Workspace store - manages workspace path selection
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useWorkspaceStore = defineStore('workspace', () => {
  const workspacePath = ref<string | null>(null);
  const isLoading = ref(false);
  const isInitialized = ref(false);

  const isReady = computed(() => workspacePath.value !== null);

  async function init(): Promise<void> {
    if (isInitialized.value) return;

    isLoading.value = true;
    try {
      // Check if running in Electron
      if (typeof window !== 'undefined' && 'nekos' in window) {
        workspacePath.value = await window.nekos.getWorkspacePath();
        console.log('[WorkspaceStore] Loaded workspace path:', workspacePath.value);
      }
    } catch (e) {
      console.error('Failed to initialize workspace:', e);
    } finally {
      isLoading.value = false;
      isInitialized.value = true;
    }
  }

  async function selectWorkspace(): Promise<boolean> {
    if (typeof window === 'undefined' || !('nekos' in window)) {
      console.warn('Not running in Electron');
      return false;
    }

    isLoading.value = true;
    try {
      const path = await window.nekos.selectWorkspace();
      if (path) {
        workspacePath.value = path;
        await window.nekos.setWorkspacePath(path);
        console.log('[WorkspaceStore] Selected workspace:', path);
        return true;
      }
    } catch (e) {
      console.error('Failed to select workspace:', e);
    } finally {
      isLoading.value = false;
    }
    return false;
  }

  function clearWorkspace(): void {
    workspacePath.value = null;
  }

  return {
    workspacePath,
    isLoading,
    isInitialized,
    isReady,
    init,
    selectWorkspace,
    clearWorkspace
  };
});
