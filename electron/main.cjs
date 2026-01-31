const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    },
    titleBarStyle: 'default',
    backgroundColor: '#faf9f7',
    show: false
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  const startUrl = process.env.ELECTRON_START_URL || `file://${path.join(__dirname, '../dist/index.html')}`;
  mainWindow.loadURL(startUrl);

  if (process.env.ELECTRON_START_URL) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ============ File System Operations ============

ipcMain.handle('select-workspace', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  return result.filePaths[0];
});

ipcMain.handle('get-workspace-path', async () => {
  const configPath = path.join(app.getPath('userData'), 'config.json');
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    return config.workspacePath || null;
  }
  return null;
});

ipcMain.handle('set-workspace-path', async (_, workspacePath) => {
  const configPath = path.join(app.getPath('userData'), 'config.json');
  const config = { workspacePath };
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  return true;
});

ipcMain.handle('read-decks', async () => {
  const configPath = path.join(app.getPath('userData'), 'config.json');
  if (!fs.existsSync(configPath)) return [];

  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  if (!config.workspacePath || !fs.existsSync(config.workspacePath)) return [];

  const decks = [];
  const seenPaths = new Set();

  const walkDir = (dir, basePath = '') => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      // Skip hidden files and folders (including .git)
      if (entry.name.startsWith('.')) continue;

      const fullPath = path.join(dir, entry.name);
      const relativePath = basePath ? `${basePath}/${entry.name}` : `/${entry.name}`;

      if (entry.isDirectory()) {
        if (!seenPaths.has(relativePath)) {
          seenPaths.add(relativePath);
          decks.push({
            path: relativePath,
            name: entry.name,
            parentPath: basePath || null
          });
        }
        walkDir(fullPath, relativePath);
      }
    }
  };

  walkDir(config.workspacePath);
  return decks;
});

ipcMain.handle('read-cards', async () => {
  const configPath = path.join(app.getPath('userData'), 'config.json');
  if (!fs.existsSync(configPath)) return [];

  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  if (!config.workspacePath || !fs.existsSync(config.workspacePath)) return [];

  const cards = [];
  const workspacePath = config.workspacePath;

  const walkDir = (dir, deckPath = '/') => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      // Skip hidden files and folders (including .git)
      if (entry.name.startsWith('.')) continue;

      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        const newDeckPath = deckPath === '/' ? `/${entry.name}` : `${deckPath}/${entry.name}`;
        walkDir(fullPath, newDeckPath);
      } else if (entry.name.endsWith('.md')) {
        try {
          const content = fs.readFileSync(fullPath, 'utf-8');
          const card = parseCardContent(entry.name, deckPath, fullPath, content);
          if (card) cards.push(card);
        } catch (e) {
          console.error('Error reading card:', fullPath, e);
        }
      }
    }
  };

  walkDir(workspacePath);
  return cards;
});

ipcMain.handle('read-card', async (_, filePath) => {
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, 'utf-8');
  const fileName = path.basename(filePath);
  const workspacePath = path.dirname(path.dirname(filePath));
  const deckPath = path.dirname(filePath).replace(workspacePath, '') || '/';

  return parseCardContent(fileName, deckPath, filePath, content);
});

ipcMain.handle('save-card', async (_, { filePath, front, back, state, nextReviewDate }) => {
  const content = `---
id: ${path.basename(filePath, '.md')}
deckPath: ${path.dirname(filePath).replace(path.dirname(path.dirname(filePath)), '')}
state: ${state || 'new'}
nextReviewDate: ${nextReviewDate || 'none'}
createdAt: ${new Date().toISOString()}
updatedAt: ${new Date().toISOString()}
---
${front}
---
${back}`;

  fs.writeFileSync(filePath, content, 'utf-8');
  return true;
});

ipcMain.handle('delete-card', async (_, filePath) => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
  return true;
});

ipcMain.handle('create-deck', async (_, { workspacePath, deckName, parentPath }) => {
  const deckDirName = parentPath
    ? path.join(workspacePath, ...parentPath.split('/').filter(Boolean), deckName)
    : path.join(workspacePath, deckName);

  if (!fs.existsSync(deckDirName)) {
    fs.mkdirSync(deckDirName, { recursive: true });
  }
  return deckDirName;
});

ipcMain.handle('delete-deck', async (_, deckPath) => {
  if (fs.existsSync(deckPath)) {
    fs.rmSync(deckPath, { recursive: true, force: true });
  }
  return true;
});

ipcMain.handle('rename-deck', async (_, { oldPath, newName }) => {
  const newPath = path.join(path.dirname(oldPath), newName);
  if (fs.existsSync(oldPath)) {
    fs.renameSync(oldPath, newPath);
  }
  return newPath;
});

ipcMain.handle('get-card-files-in-deck', async (_, deckPath) => {
  if (!fs.existsSync(deckPath)) return [];

  const files = fs.readdirSync(deckPath);
  return files
    .filter(f => f.endsWith('.md'))
    .map(f => path.join(deckPath, f));
});

function parseCardContent(fileName, deckPath, filePath, content) {
  const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  let body = content;
  let frontmatter = {};

  if (fmMatch) {
    const fmText = fmMatch[1];
    body = content.substring(fmMatch[0].length).trim();

    const idMatch = fmText.match(/id:\s*(.+)/);
    const stateMatch = fmText.match(/state:\s*(.+)/);
    const nextReviewMatch = fmText.match(/nextReviewDate:\s*(.+)/);
    const createdMatch = fmText.match(/createdAt:\s*(.+)/);
    const updatedMatch = fmText.match(/updatedAt:\s*(.+)/);

    frontmatter = {
      id: idMatch?.[1]?.trim() || path.basename(filePath, '.md'),
      state: stateMatch?.[1]?.trim() || 'new',
      nextReviewDate: nextReviewMatch?.[1]?.trim() === 'none' ? null : nextReviewMatch?.[1]?.trim(),
      createdAt: createdMatch?.[1]?.trim() || new Date().toISOString(),
      updatedAt: updatedMatch?.[1]?.trim() || new Date().toISOString()
    };
  }

  const parts = body.split(/\r?\n---\r?\n/);
  const front = parts[0]?.trim() || '';
  const back = parts[1]?.trim() || '';

  return {
    id: frontmatter.id,
    filePath,
    deckPath: deckPath === '/' ? '/' : deckPath,
    front,
    back,
    state: frontmatter.state,
    nextReviewDate: frontmatter.nextReviewDate,
    createdAt: frontmatter.createdAt,
    updatedAt: frontmatter.updatedAt,
    lastModified: fs.statSync(filePath).mtimeMs
  };
}

// ============ Git Operations ============

ipcMain.handle('git-status', async (_, repoPath) => {
  if (!repoPath || !fs.existsSync(path.join(repoPath, '.git'))) {
    return { isGitRepo: false, changes: 0 };
  }

  try {
    const { stdout } = await execGitCommand(repoPath, 'status --porcelain');
    const changes = stdout.trim().split('\n').filter(Boolean).length;
    return { isGitRepo: true, changes };
  } catch {
    return { isGitRepo: false, changes: 0 };
  }
});

ipcMain.handle('git-init', async (_, repoPath) => {
  try {
    await execGitCommand(repoPath, 'init');
    const gitignore = `# Neko temp files
*.swp
*~`;
    fs.writeFileSync(path.join(repoPath, '.gitignore'), gitignore);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('git-commit', async (_, { repoPath, message }) => {
  try {
    await execGitCommand(repoPath, 'add -A');
    await execGitCommand(repoPath, `commit -m "${message}"`);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('git-push', async (_, repoPath) => {
  try {
    await execGitCommand(repoPath, 'push');
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('git-pull', async (_, repoPath) => {
  try {
    await execGitCommand(repoPath, 'pull');
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('git-get-last-commit-time', async (_, repoPath) => {
  try {
    const { stdout } = await execGitCommand(repoPath, 'log -1 --format="%ci"');
    return stdout.trim();
  } catch {
    return null;
  }
});

ipcMain.handle('open-workspace', async (_, repoPath) => {
  await shell.openPath(repoPath);
  return true;
});

function execGitCommand(cwd, command) {
  return new Promise((resolve, reject) => {
    exec(`git ${command}`, { cwd }, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
