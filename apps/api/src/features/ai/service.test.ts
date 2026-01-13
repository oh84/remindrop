import { describe, it, expect, vi, beforeEach } from 'vitest';
import { aiService } from './service';
import { getAnthropicClient } from '../../lib/anthropic';

// Mock Anthropic client
vi.mock('../../lib/anthropic', () => ({
  getAnthropicClient: vi.fn(),
  CLAUDE_HAIKU_MODEL: 'claude-3-5-haiku-latest',
}));

describe('AIService', () => {
  const mockAnthropicClient = {
    messages: {
      create: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAnthropicClient).mockReturnValue(mockAnthropicClient as any);
  });

  describe('fetchWebContent', () => {
    it('should fetch and extract text content from HTML', async () => {
      const mockUrl = 'https://example.com';
      const mockHtml = `
        <html>
          <head><title>Test Page</title></head>
          <body>
            <h1>Hello World</h1>
            <p>This is a test paragraph.</p>
            <script>console.log('test');</script>
            <style>body { color: red; }</style>
          </body>
        </html>
      `;

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => mockHtml,
      });

      const result = await aiService.fetchWebContent(mockUrl);

      expect(global.fetch).toHaveBeenCalledWith(mockUrl, {
        headers: {
          'User-Agent': 'Remindrop/1.0 (Bookmark Manager)',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: expect.any(AbortSignal),
      });
      expect(result).toContain('Hello World');
      expect(result).toContain('This is a test paragraph');
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('<style>');
      expect(result).not.toContain('console.log');
    });

    it('should handle HTTP errors', async () => {
      const mockUrl = 'https://example.com';

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(aiService.fetchWebContent(mockUrl)).rejects.toThrow('Failed to fetch URL: 404 Not Found');
    });

    it('should handle timeout errors', async () => {
      const mockUrl = 'https://example.com';

      global.fetch = vi.fn().mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout')), 100);
        });
      });

      await expect(aiService.fetchWebContent(mockUrl)).rejects.toThrow();
    });

    it('should limit content length to MAX_CONTENT_LENGTH', async () => {
      const mockUrl = 'https://example.com';
      const longContent = 'a'.repeat(20000);
      const mockHtml = `<html><body><p>${longContent}</p></body></html>`;

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => mockHtml,
      });

      const result = await aiService.fetchWebContent(mockUrl);

      expect(result.length).toBeLessThanOrEqual(10000);
    });

    it('should decode HTML entities', async () => {
      const mockUrl = 'https://example.com';
      const mockHtml = '<html><body><p>Hello &amp; World &lt;test&gt; &quot;quote&quot;</p></body></html>';

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => mockHtml,
      });

      const result = await aiService.fetchWebContent(mockUrl);

      expect(result).toContain('Hello & World');
      expect(result).toContain('<test>');
      expect(result).toContain('"quote"');
    });
  });

  describe('generateSummary', () => {
    it('should generate summary from content', async () => {
      const mockContent = 'This is a long article about technology and innovation...';
      const mockSummary = 'This article discusses technology and innovation.';

      mockAnthropicClient.messages.create = vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: mockSummary,
          },
        ],
      });

      const result = await aiService.generateSummary(mockContent);

      expect(result).toBe(mockSummary);
      expect(getAnthropicClient).toHaveBeenCalled();
      expect(mockAnthropicClient.messages.create).toHaveBeenCalledWith({
        model: 'claude-3-5-haiku-latest',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: expect.stringContaining(mockContent),
          },
        ],
      });
    });

    it('should throw error when no text response is returned', async () => {
      const mockContent = 'Some content';

      mockAnthropicClient.messages.create = vi.fn().mockResolvedValue({
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: 'image/jpeg', data: 'base64data' },
          },
        ],
      });

      await expect(aiService.generateSummary(mockContent)).rejects.toThrow('No text response from Claude');
    });

    it('should throw error when API key is not configured', async () => {
      vi.mocked(getAnthropicClient).mockImplementation(() => {
        throw new Error('ANTHROPIC_API_KEY is not configured');
      });

      await expect(aiService.generateSummary('content')).rejects.toThrow('ANTHROPIC_API_KEY is not configured');
    });
  });

  describe('generateTags', () => {
    it('should generate tags from content', async () => {
      const mockContent = 'This is an article about JavaScript, React, and frontend development.';
      const mockResponse = 'JavaScript, React, Frontend, Web Development';

      mockAnthropicClient.messages.create = vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: mockResponse,
          },
        ],
      });

      const result = await aiService.generateTags(mockContent);

      expect(result).toEqual(['JavaScript', 'React', 'Frontend', 'Web Development']);
      expect(getAnthropicClient).toHaveBeenCalled();
      expect(mockAnthropicClient.messages.create).toHaveBeenCalledWith({
        model: 'claude-3-5-haiku-latest',
        max_tokens: 200,
        messages: [
          {
            role: 'user',
            content: expect.stringContaining(mockContent),
          },
        ],
      });
    });

    it('should filter out empty tags', async () => {
      const mockContent = 'Some content';
      const mockResponse = 'Tag1, , Tag2,  , Tag3';

      mockAnthropicClient.messages.create = vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: mockResponse,
          },
        ],
      });

      const result = await aiService.generateTags(mockContent);

      expect(result).toEqual(['Tag1', 'Tag2', 'Tag3']);
    });

    it('should limit tags to 10', async () => {
      const mockContent = 'Some content';
      const mockResponse = Array.from({ length: 15 }, (_, i) => `Tag${i + 1}`).join(', ');

      mockAnthropicClient.messages.create = vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: mockResponse,
          },
        ],
      });

      const result = await aiService.generateTags(mockContent);

      expect(result).toHaveLength(10);
    });

    it('should filter out tags longer than 50 characters', async () => {
      const mockContent = 'Some content';
      const longTag = 'a'.repeat(60);
      const mockResponse = `ValidTag, ${longTag}, AnotherTag`;

      mockAnthropicClient.messages.create = vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: mockResponse,
          },
        ],
      });

      const result = await aiService.generateTags(mockContent);

      expect(result).toEqual(['ValidTag', 'AnotherTag']);
      expect(result.every((tag) => tag.length <= 50)).toBe(true);
    });

    it('should handle empty response', async () => {
      const mockContent = 'Some content';

      mockAnthropicClient.messages.create = vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: '',
          },
        ],
      });

      const result = await aiService.generateTags(mockContent);

      expect(result).toEqual([]);
    });

    it('should throw error when no text response is returned', async () => {
      const mockContent = 'Some content';

      mockAnthropicClient.messages.create = vi.fn().mockResolvedValue({
        content: [],
      });

      await expect(aiService.generateTags(mockContent)).rejects.toThrow('No text response from Claude');
    });

    it('should trim whitespace from tags', async () => {
      const mockContent = 'Some content';
      const mockResponse = '  Tag1  ,  Tag2  ,  Tag3  ';

      mockAnthropicClient.messages.create = vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: mockResponse,
          },
        ],
      });

      const result = await aiService.generateTags(mockContent);

      expect(result).toEqual(['Tag1', 'Tag2', 'Tag3']);
    });
  });
});
