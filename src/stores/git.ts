// Git store - manages Git operations via IPC
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useWorkspaceStore } from './workspace';

export const useGitStore = defineStore('git', () => {
  const isGitRepo = ref(false);
  const pendingChanges = ref(0);
  const lastCommitTime = ref<string | null>(null);
  const isLoading = ref(false);
  const isSyncing = ref(false);

  async function refreshStatus(): Promise<void> {
    const workspaceStore = useWorkspaceStore();
    if (!workspaceStore.workspacePath) return;

    isLoading.value = true;
    try {
      if (typeof window !== 'undefined' && 'nekos' in window) {
        const status = await window.nekos.gitStatus(workspaceStore.workspacePath);
        isGitRepo.value = status.isGitRepo;
        pendingChanges.value = status.changes;

        if (status.isGitRepo) {
          lastCommitTime.value = await window.nekos.gitLastCommitTime(workspaceStore.workspacePath);
        }
      }
    } catch (e) {
      console.error('Failed to refresh git status:', e);
    } finally {
      isLoading.value = false;
    }
  }

  async function initRepo(): Promise<{ success: boolean; error?: string }> {
    const workspaceStore = useWorkspaceStore();
    if (!workspaceStore.workspacePath) {
      return { success: false, error: 'No workspace selected' };
    }

    isLoading.value = true;
    try {
      if (typeof window !== 'undefined' && 'nekos' in window) {
        const result = await window.nekos.gitInit(workspaceStore.workspacePath);
        if (result.success) {
          isGitRepo.value = true;
        }
        return result;
      }
    } catch (e) {
      console.error('Failed to init git repo:', e);
    } finally {
      isLoading.value = false;
    }
    return { success: false, error: 'Unknown error' };
  }

  async function commit(message: string): Promise<{ success: boolean; error?: string }> {
    const workspaceStore = useWorkspaceStore();
    if (!workspaceStore.workspacePath) {
      return { success: false, error: 'No workspace selected' };
    }

    isSyncing.value = true;
    try {
      if (typeof window !== 'undefined' && 'nekos' in window) {
        const result = await window.nekos.gitCommit({
          repoPath: workspaceStore.workspacePath,
          message
        });
        if (result.success) {
          await refreshStatus();
        }
        return result;
      }
    } catch (e) {
      console.error('Failed to commit:', e);
    } finally {
      isSyncing.value = false;
    }
    return { success: false, error: 'Unknown error' };
  }

  async function push(): Promise<{ success: boolean; error?: string }> {
    const workspaceStore = useWorkspaceStore();
    if (!workspaceStore.workspacePath) {
      return { success: false, error: 'No workspace selected' };
    }

    isSyncing.value = true;
    try {
      if (typeof window !== 'undefined' && 'nekos' in window) {
        const result = await window.nekos.gitPush(workspaceStore.workspacePath);
        return result;
      }
    } catch (e) {
      console.error('Failed to push:', e);
    } finally {
      isSyncing.value = false;
    }
    return { success: false, error: 'Unknown error' };
  }

  async function pull(): Promise<{ success: boolean; error?: string }> {
    const workspaceStore = useWorkspaceStore();
    if (!workspaceStore.workspacePath) {
      return { success: false, error: 'No workspace selected' };
    }

    isSyncing.value = true;
    try {
      if (typeof window !== 'undefined' && 'nekos' in window) {
        const result = await window.nekos.gitPull(workspaceStore.workspacePath);
        return result;
      }
    } catch (e) {
      console.error('Failed to pull:', e);
    } finally {
      isSyncing.value = false;
    }
    return { success: false, error: 'Unknown error' };
  }

  async function openWorkspace(): Promise<void> {
    const workspaceStore = useWorkspaceStore();
    if (workspaceStore.workspacePath && typeof window !== 'undefined' && 'nekos' in window) {
      await window.nekos.openWorkspace(workspaceStore.workspacePath);
    }
  }

  return {
    isGitRepo,
    pendingChanges,
    lastCommitTime,
    isLoading,
    isSyncing,
    refreshStatus,
    initRepo,
    commit,
    push,
    pull,
    openWorkspace
  };
});
