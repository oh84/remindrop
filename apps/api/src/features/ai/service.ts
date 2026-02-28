import { lookup } from 'dns/promises';
import { getAnthropicClient, CLAUDE_HAIKU_MODEL } from '../../lib/anthropic';
import { buildSummarizePrompt, buildGenerateTagsPrompt } from './prompts';

const MAX_CONTENT_LENGTH = 10000;
const MAX_RESPONSE_SIZE = 5 * 1024 * 1024; // 5MB
const FETCH_TIMEOUT_MS = 10000;
const ALLOWED_SCHEMES = new Set(['http:', 'https:']);

const PRIVATE_IP_RANGES = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\./,
  /^::1$/,
  /^fc00:/i,
  /^fd/i,
  /^fe80:/i,
];

function isPrivateIp(ip: string): boolean {
  return PRIVATE_IP_RANGES.some((range) => range.test(ip));
}

/**
 * Validate URL for SSRF prevention: scheme must be http/https,
 * resolved IP must not be in private/loopback ranges.
 */
async function validateUrl(url: string): Promise<void> {
  const parsed = new URL(url);

  if (!ALLOWED_SCHEMES.has(parsed.protocol)) {
    throw new Error(`Blocked URL scheme: ${parsed.protocol}`);
  }

  const hostname = parsed.hostname;

  if (hostname === 'localhost' || hostname === '[::1]') {
    throw new Error('Blocked request to localhost');
  }

  try {
    const { address } = await lookup(hostname);
    if (isPrivateIp(address)) {
      throw new Error('Blocked request to private IP address');
    }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Blocked')) {
      throw error;
    }
    throw new Error(`DNS resolution failed for ${hostname}`);
  }
}

/**
 * Fetch webpage content from URL with SSRF protection.
 */
export async function fetchWebContent(url: string): Promise<string> {
  await validateUrl(url);

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Remindrop/1.0 (Bookmark Manager)',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
    redirect: 'manual',
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (response.status >= 300 && response.status < 400) {
    throw new Error('Redirects are not followed for security reasons');
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.startsWith('text/html') && !contentType.startsWith('application/xhtml+xml')) {
    throw new Error(`Unexpected content type: ${contentType}`);
  }

  const contentLength = response.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > MAX_RESPONSE_SIZE) {
    throw new Error('Response too large');
  }

  const html = await response.text();
  const textContent = extractTextFromHtml(html);
  return textContent.slice(0, MAX_CONTENT_LENGTH);
}

/**
 * Extract text content from HTML. Removes script/style tags (looped to handle
 * nested/broken patterns), strips remaining tags, and decodes common entities
 * in a single pass to avoid double-unescaping.
 */
function extractTextFromHtml(html: string): string {
  let text = html;

  const dangerousTagPattern = /<script\b[^>]*>[\s\S]*?<\/script[^>]*>/gi;
  let prev = '';
  while (text !== prev) {
    prev = text;
    text = text.replace(dangerousTagPattern, '');
  }

  const styleTagPattern = /<style\b[^>]*>[\s\S]*?<\/style[^>]*>/gi;
  prev = '';
  while (text !== prev) {
    prev = text;
    text = text.replace(styleTagPattern, '');
  }

  text = text.replace(/<[^>]+>/g, ' ');

  const entityMap: Record<string, string> = {
    nbsp: ' ',
    amp: '&',
    lt: '<',
    gt: '>',
    quot: '"',
    '#39': "'",
  };
  text = text.replace(/&(nbsp|amp|lt|gt|quot|#39);/g, (_, entity: string) => entityMap[entity] ?? _);

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
