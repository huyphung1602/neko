// Type declarations for Electron IPC bridge
export {};

declare global {
  interface Window {
    nekos: {
      // Workspace
      selectWorkspace: () => Promise<string | null>;
      getWorkspacePath: () => Promise<string | null>;
      setWorkspacePath: (path: string) => Promise<boolean>;

      // Decks
      readDecks: () => Promise<Array<{
        path: string;
        name: string;
        parentPath: string | null;
      }>>;
      createDeck: (data: {
        workspacePath: string;
        deckName: string;
        parentPath: string | null;
      }) => Promise<string>;
      deleteDeck: (path: string) => Promise<boolean>;
      renameDeck: (data: { oldPath: string; newName: string }) => Promise<string>;

      // Cards
      readCards: () => Promise<Array<{
        id: string;
        filePath: string;
        deckPath: string;
        front: string;
        back: string;
        state: string;
        nextReviewDate: string | null;
        createdAt: string;
        updatedAt: string;
        lastModified: number;
      }>>;
      readCard: (filePath: string) => Promise<any | null>;
      saveCard: (data: {
        filePath: string;
        front: string;
        back: string;
        state?: string;
        nextReviewDate?: string | null;
      }) => Promise<boolean>;
      deleteCard: (filePath: string) => Promise<boolean>;
      getCardFilesInDeck: (deckPath: string) => Promise<string[]>;

      // Git
      gitStatus: (repoPath: string) => Promise<{
        isGitRepo: boolean;
        changes: number;
      }>;
      gitInit: (repoPath: string) => Promise<{ success: boolean; error?: string }>;
      gitCommit: (data: {
        repoPath: string;
        message: string;
      }) => Promise<{ success: boolean; error?: string }>;
      gitPush: (repoPath: string) => Promise<{ success: boolean; error?: string }>;
      gitPull: (repoPath: string) => Promise<{ success: boolean; error?: string }>;
      gitLastCommitTime: (repoPath: string) => Promise<string | null>;
      openWorkspace: (repoPath: string) => Promise<boolean>;

      // Events
      onWorkspaceChanged: (callback: (data: any) => void) => void;
    };
  }
}
