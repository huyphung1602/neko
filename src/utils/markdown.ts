// Card markdown parsing utilities
import { marked } from 'marked';

export function parseCardContent(content: string): { front: string; back: string } {
  // Split by the first "---" separator
  const parts = content.split(/^---$/m);

  if (parts.length >= 2) {
    return {
      front: parts[0].trim(),
      back: parts[1].trim()
    };
  }

  // If no separator, treat entire content as front
  return {
    front: content.trim(),
    back: ''
  };
}

export function formatCardContent(front: string, back: string): string {
  return `${front}\n---\n${back}`;
}

export function renderMarkdown(markdown: string): string {
  return marked.parse(markdown, { async: false }) as string;
}

export function extractFrontmatter(content: string): { metadata: Record<string, unknown>; body: string } {
  // Simple frontmatter extraction (YAML style)
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

  if (frontmatterMatch) {
    const yamlContent = frontmatterMatch[1];
    const body = frontmatterMatch[2].trim();

    // Parse YAML (simple implementation)
    const metadata: Record<string, unknown> = {};
    yamlContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split(':');
      if (key && valueParts.length > 0) {
        const value = valueParts.join(':').trim();
        // Try to parse as number or boolean
        if (value === 'true') metadata[key.trim()] = true;
        else if (value === 'false') metadata[key.trim()] = false;
        else if (!isNaN(Number(value))) metadata[key.trim()] = Number(value);
        else metadata[key.trim()] = value;
      }
    });

    return { metadata, body };
  }

  return { metadata: {}, body: content };
}

export function generateCardId(): string {
  // Generate a short ID based on timestamp
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  return `card_${timestamp}_${random}`;
}

export function generateDeckId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  return `deck_${timestamp}_${random}`;
}

export function cardToMarkdown(card: { id: string; deckPath: string; front: string; back: string; tags: string[]; state: string; nextReviewDate: string | null; createdAt: string; updatedAt: string }, includeMetadata = false): string {
  let frontmatter = '';
  if (includeMetadata) {
    frontmatter = `---
id: ${card.id}
deckPath: ${card.deckPath}
tags: ${card.tags.join(', ')}
state: ${card.state}
nextReviewDate: ${card.nextReviewDate || 'none'}
createdAt: ${card.createdAt}
updatedAt: ${card.updatedAt}
---
`;
  }

  return frontmatter + formatCardContent(card.front, card.back);
}

export function markdownToCard(content: string, deckPath: string): Partial<{ id: string; deckPath: string; front: string; back: string; tags: string[]; state: string; nextReviewDate: string | null; createdAt: string; updatedAt: string }> {
  const { metadata, body } = extractFrontmatter(content);
  const { front, back } = parseCardContent(body);

  return {
    id: (metadata.id as string) || generateCardId(),
    deckPath,
    front,
    back,
    tags: typeof metadata.tags === 'string'
      ? metadata.tags.split(',').map((t: string) => t.trim())
      : (metadata.tags as string[]) || [],
    state: (metadata.state as string) || 'new',
    nextReviewDate: metadata.nextReviewDate === 'none' ? null : (metadata.nextReviewDate as string) || null,
    createdAt: (metadata.createdAt as string) || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}
