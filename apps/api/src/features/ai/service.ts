import { getAnthropicClient, CLAUDE_HAIKU_MODEL } from '../../lib/anthropic';
import { buildSummarizePrompt, buildGenerateTagsPrompt } from './prompts';

// Maximum content length to send to API (to control costs and token limits)
const MAX_CONTENT_LENGTH = 10000;

/**
 * Fetch webpage content from URL
 */
export async function fetchWebContent(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Remindrop/1.0 (Bookmark Manager)',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
    signal: AbortSignal.timeout(10000), // 10 second timeout
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  // Extract text content from HTML (simple approach)
  const textContent = extractTextFromHtml(html);
  return textContent.slice(0, MAX_CONTENT_LENGTH);
}

/**
 * Extract text content from HTML (removes tags, scripts, styles)
 */
function extractTextFromHtml(html: string): string {
  // Remove script and style tags with their content
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  // Remove all HTML tags
  text = text.replace(/<[^>]+>/g, ' ');
  // Decode HTML entities
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  // Normalize whitespace
  text = text.replace(/\s+/g, ' ').trim();
  return text;
}

/**
 * Generate summary using Claude Haiku
 */
export async function generateSummary(content: string): Promise<string> {
  const anthropic = getAnthropicClient();
  const prompt = buildSummarizePrompt(content);

  const response = await anthropic.messages.create({
    model: CLAUDE_HAIKU_MODEL,
    max_tokens: 500,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  return textBlock.text.trim();
}

/**
 * Generate tags using Claude Haiku
 */
export async function generateTags(content: string): Promise<string[]> {
  const anthropic = getAnthropicClient();
  const prompt = buildGenerateTagsPrompt(content);

  const response = await anthropic.messages.create({
    model: CLAUDE_HAIKU_MODEL,
    max_tokens: 200,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  // Parse comma-separated tags
  const tags = textBlock.text
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0 && tag.length <= 50);

  return tags.slice(0, 10); // Max 10 tags
}

export const aiService = {
  fetchWebContent,
  generateSummary,
  generateTags,
};
