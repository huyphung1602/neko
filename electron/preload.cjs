const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('nekos', {
  // Workspace
  selectWorkspace: () => ipcRenderer.invoke('select-workspace'),
  getWorkspacePath: () => ipcRenderer.invoke('get-workspace-path'),
  setWorkspacePath: (path) => ipcRenderer.invoke('set-workspace-path', path),

  // Decks
  readDecks: () => ipcRenderer.invoke('read-decks'),
  createDeck: (data) => ipcRenderer.invoke('create-deck', data),
  deleteDeck: (path) => ipcRenderer.invoke('delete-deck', path),
  renameDeck: (data) => ipcRenderer.invoke('rename-deck', data),

  // Cards
  readCards: () => ipcRenderer.invoke('read-cards'),
  readCard: (filePath) => ipcRenderer.invoke('read-card', filePath),
  saveCard: (data) => ipcRenderer.invoke('save-card', data),
  deleteCard: (filePath) => ipcRenderer.invoke('delete-card', filePath),
  getCardFilesInDeck: (deckPath) => ipcRenderer.invoke('get-card-files-in-deck', deckPath),

  // Git
  gitStatus: (repoPath) => ipcRenderer.invoke('git-status', repoPath),
  gitInit: (repoPath) => ipcRenderer.invoke('git-init', repoPath),
  gitCommit: (data) => ipcRenderer.invoke('git-commit', data),
  gitPush: (repoPath) => ipcRenderer.invoke('git-push', repoPath),
  gitPull: (repoPath) => ipcRenderer.invoke('git-pull', repoPath),
  gitLastCommitTime: (repoPath) => ipcRenderer.invoke('git-get-last-commit-time', repoPath),
  openWorkspace: (repoPath) => ipcRenderer.invoke('open-workspace', repoPath),

  // Events
  onWorkspaceChanged: (callback) => {
    ipcRenderer.on('workspace-changed', (_, data) => callback(data));
  }
});
