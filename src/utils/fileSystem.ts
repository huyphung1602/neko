// File System utilities for two-way sync with IndexedDB

export interface FileInfo {
  path: string;
  name: string;
  lastModified: number;
  content?: string;
}

export interface DirectoryInfo {
  path: string;
  name: string;
  files: FileInfo[];
  subdirectories: DirectoryInfo[];
}

export type StorageType = 'fs-api' | 'opfs' | 'memory';

class FileSystemSync {
  private storageType: StorageType = 'memory';
  private rootDir: FileSystemDirectoryHandle | null = null;
  private directoryPath: string = '';

  async init(): Promise<StorageType> {
    if ('showDirectoryPicker' in window) {
      this.storageType = 'fs-api';
    } else if ('storage' in navigator) {
      this.storageType = 'opfs';
    } else {
      this.storageType = 'memory';
    }
    console.log('[FileSystemSync] Storage type:', this.storageType);
    return this.storageType;
  }

  getStorageType(): StorageType {
    return this.storageType;
  }

  async selectDirectory(): Promise<boolean> {
    if (this.storageType !== 'fs-api') {
      return false;
    }

    try {
      // @ts-expect-error showDirectoryPicker is not in TypeScript types yet
      const dirHandle = await window.showDirectoryPicker();
      this.rootDir = dirHandle;
      this.directoryPath = dirHandle.name;
      console.log('[FileSystemSync] Selected directory:', this.directoryPath);
      return true;
    } catch (e) {
      console.error('[FileSystemSync] Failed to select directory:', e);
      return false;
    }
  }

  async initOPFS(subdir: string = 'neko'): Promise<void> {
    if (this.storageType !== 'opfs') return;

    try {
      const root = await navigator.storage.getDirectory();
      this.rootDir = root as unknown as FileSystemDirectoryHandle;
      this.directoryPath = subdir;

      // Get or create the subdirectory
      try {
        await this.rootDir.getDirectoryHandle(subdir, { create: true });
      } catch {
        // Directory might already exist
      }
      console.log('[FileSystemSync] OPFS directory initialized:', subdir);
    } catch (e) {
      console.error('[FileSystemSync] Failed to init OPFS:', e);
      this.storageType = 'memory';
    }
  }

  async scanDirectory(dirHandle?: FileSystemDirectoryHandle, basePath: string = ''): Promise<DirectoryInfo> {
    const handle = dirHandle || this.rootDir;
    if (!handle) {
      throw new Error('No directory selected');
    }

    const name = basePath.split('/').pop() || this.directoryPath || 'root';
    const info: DirectoryInfo = {
      path: basePath || '/',
      name,
      files: [],
      subdirectories: []
    };

    for await (const entry of handle as unknown as AsyncIterable<{ kind: string; name: string }>) {
      if (entry.kind === 'file') {
        const fileHandle = entry as FileSystemFileHandle;
        try {
          const file = await fileHandle.getFile();
          info.files.push({
            path: basePath ? `${basePath}/${entry.name}` : entry.name,
            name: entry.name,
            lastModified: file.lastModified
          });
        } catch (e) {
          console.warn('[FileSystemSync] Failed to get file info:', entry.name);
        }
      } else if (entry.kind === 'directory') {
        const subDirHandle = await handle.getDirectoryHandle(entry.name);
        const subDirInfo = await this.scanDirectory(subDirHandle, basePath ? `${basePath}/${entry.name}` : entry.name);
        info.subdirectories.push(subDirInfo);
      }
    }

    return info;
  }

  async getAllFiles(dirHandle?: FileSystemDirectoryHandle, basePath: string = ''): Promise<FileInfo[]> {
    const handle = dirHandle || this.rootDir;
    if (!handle) return [];

    const files: FileInfo[] = [];

    for await (const entry of handle as unknown as AsyncIterable<{ kind: string; name: string }>) {
      if (entry.kind === 'file') {
        const fileHandle = entry as FileSystemFileHandle;
        try {
          const file = await fileHandle.getFile();
          files.push({
            path: basePath ? `${basePath}/${entry.name}` : entry.name,
            name: entry.name,
            lastModified: file.lastModified
          });
        } catch (e) {
          // Skip files we can't read
        }
      } else if (entry.kind === 'directory') {
        const subDirHandle = await handle.getDirectoryHandle(entry.name);
        const subFiles = await this.getAllFiles(subDirHandle, basePath ? `${basePath}/${entry.name}` : entry.name);
        files.push(...subFiles);
      }
    }

    return files;
  }

  async readFile(filePath: string): Promise<string | null> {
    if (!this.rootDir) {
      console.log('[FileSystemSync] readFile: no directory');
      return null;
    }

    const parts = filePath.split('/').filter(Boolean);
    let current: FileSystemDirectoryHandle = this.rootDir;

    for (let i = 0; i < parts.length - 1; i++) {
      try {
        current = await current.getDirectoryHandle(parts[i], { create: false });
      } catch {
        console.log('[FileSystemSync] readFile: directory not found:', parts[i]);
        return null;
      }
    }

    const fileName = parts[parts.length - 1];
    try {
      const fileHandle = await current.getFileHandle(fileName, { create: false });
      const file = await fileHandle.getFile();
      return await file.text();
    } catch {
      console.log('[FileSystemSync] readFile: file not found:', filePath);
      return null;
    }
  }

  async writeFile(filePath: string, content: string): Promise<boolean> {
    if (!this.rootDir) {
      console.log('[FileSystemSync] writeFile: no directory');
      return false;
    }

    const parts = filePath.split('/').filter(Boolean);
    let current: FileSystemDirectoryHandle = this.rootDir;

    for (let i = 0; i < parts.length - 1; i++) {
      try {
        current = await current.getDirectoryHandle(parts[i], { create: true });
      } catch {
        return false;
      }
    }

    const fileName = parts[parts.length - 1];
    try {
      const fileHandle = await current.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();
      console.log('[FileSystemSync] Wrote file:', filePath);
      return true;
    } catch (e) {
      console.error('[FileSystemSync] writeFile failed:', e);
      return false;
    }
  }

  async deleteFile(filePath: string): Promise<boolean> {
    if (!this.rootDir) return false;

    const parts = filePath.split('/').filter(Boolean);
    let current: FileSystemDirectoryHandle = this.rootDir;

    for (let i = 0; i < parts.length - 1; i++) {
      try {
        current = await current.getDirectoryHandle(parts[i], { create: false });
      } catch {
        return false;
      }
    }

    const fileName = parts[parts.length - 1];
    try {
      await current.removeEntry(fileName);
      console.log('[FileSystemSync] Deleted file:', filePath);
      return true;
    } catch {
      return false;
    }
  }

  async createDirectory(path: string): Promise<boolean> {
    if (!this.rootDir) return false;

    const parts = path.split('/').filter(Boolean);
    let current: FileSystemDirectoryHandle = this.rootDir;

    for (const part of parts) {
      try {
        current = await current.getDirectoryHandle(part, { create: true });
      } catch {
        return false;
      }
    }

    return true;
  }

  async renameDirectory(oldPath: string, newPath: string): Promise<boolean> {
    // For FS API, we'd need to copy and delete
    // This is complex - may need user interaction
    console.log('[FileSystemSync] renameDirectory not fully implemented for', oldPath, '->', newPath);
    return false;
  }

  getDirectoryPath(): string {
    return this.directoryPath;
  }

  isReady(): boolean {
    return this.rootDir !== null;
  }
}

export const fileSystemSync = new FileSystemSync();
