import { lookup } from 'dns/promises';
import { Agent, fetch as undiciFetch, type Response as UndiciResponse } from 'undici';
import { getAnthropicClient, CLAUDE_HAIKU_MODEL } from '../../lib/anthropic';
import { buildSummarizePrompt, buildGenerateTagsPrompt } from './prompts';

const MAX_CONTENT_LENGTH = 10000;
const MAX_RESPONSE_SIZE = 5 * 1024 * 1024; // 5MB
const FETCH_TIMEOUT_MS = 10000;
const ALLOWED_SCHEMES = new Set(['http:', 'https:']);

const PRIVATE_IP_RANGES = [
  /^127\./,
  /^10\./,
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\./,
  /^198\.(1[89])\./,
  /^2(2[4-9]|3\d)\./,
  /^::1$/,
  /^::$/,
  /^::ffff:127\./i,
  /^::ffff:10\./i,
  /^::ffff:100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./i,
  /^::ffff:172\.(1[6-9]|2\d|3[01])\./i,
  /^::ffff:192\.168\./i,
  /^::ffff:169\.254\./i,
  /^::ffff:0\./i,
  /^::ffff:198\.(1[89])\./i,
  /^::ffff:2(2[4-9]|3\d)\./i,
  /^fc00:/i,
  /^fd/i,
  /^fe80:/i,
];

function isPrivateIp(ip: string): boolean {
  return PRIVATE_IP_RANGES.some((range) => range.test(ip));
}

async function readResponseTextWithLimit(response: UndiciResponse, maxBytes: number): Promise<string> {
  if (!response.body) {
    const text = await response.text();
    const byteLength = new TextEncoder().encode(text).byteLength;
    if (byteLength > maxBytes) {
      throw new Error('Response too large');
    }
    return text;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let totalBytes = 0;
  let text = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    totalBytes += value.byteLength;
    if (totalBytes > maxBytes) {
      await reader.cancel();
      throw new Error('Response too large');
    }

    text += decoder.decode(value, { stream: true });
  }

  text += decoder.decode();
  return text;
}

interface ResolvedAddress {
  address: string;
  family: 4 | 6;
}

/**
 * Validate URL for SSRF prevention and resolve DNS once.
 * Returns the resolved IP so the caller can pin the connection to it,
 * preventing DNS rebinding attacks.
 */
async function validateAndResolveUrl(url: string): Promise<ResolvedAddress> {
  const parsed = new URL(url);

  if (!ALLOWED_SCHEMES.has(parsed.protocol)) {
    throw new Error(`Blocked URL scheme: ${parsed.protocol}`);
  }

  const hostname = parsed.hostname;

  if (hostname === 'localhost' || hostname === '[::1]') {
    throw new Error('Blocked request to localhost');
  }

  try {
    const { address, family } = await lookup(hostname);
    if (isPrivateIp(address)) {
      throw new Error('Blocked request to private IP address');
    }
    return { address, family: family as 4 | 6 };
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Blocked')) {
      throw error;
    }
    throw new Error(`DNS resolution failed for ${hostname}`);
  }
}

/**
 * Fetch webpage content from URL with SSRF protection.
 * Uses the pre-resolved IP via a pinned undici Agent to prevent
 * DNS rebinding (TOCTOU) attacks.
 */
export async function fetchWebContent(url: string): Promise<string> {
  const resolved = await validateAndResolveUrl(url);

  const dispatcher = new Agent({
    connect: {
      lookup: (_hostname, _options, callback) => {
        callback(null, resolved.address, resolved.family);
      },
    },
  });

  const response = await undiciFetch(url, {
    headers: {
      'User-Agent': 'Remindrop/1.0 (Bookmark Manager)',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
    redirect: 'manual',
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    dispatcher,
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

  const html = await readResponseTextWithLimit(response, MAX_RESPONSE_SIZE);
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
