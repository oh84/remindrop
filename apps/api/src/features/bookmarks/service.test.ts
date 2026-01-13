import { describe, it, expect, vi, beforeEach } from 'vitest';
import { bookmarkService } from './service';
import { bookmarkRepository, type BookmarkWithTags } from './repository';
import { aiService } from '../ai';
import type { Bookmark } from '../../db/schema';

// Mock repository
vi.mock('./repository', () => ({
  bookmarkRepository: {
    findManyByUserId: vi.fn(),
    countByUserId: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findOrCreateTag: vi.fn(),
    addTagsToBookmark: vi.fn(),
  },
}));

// Mock AI service
vi.mock('../ai', () => ({
  aiService: {
    fetchWebContent: vi.fn(),
    generateSummary: vi.fn(),
    generateTags: vi.fn(),
  },
}));

describe('BookmarkService', () => {
  const mockUserId = 'user-123';
  const mockOtherUserId = 'user-456';
  const mockBookmarkId = '123e4567-e89b-12d3-a456-426614174000';

  const createMockBookmark = (overrides?: Partial<Bookmark>): Bookmark => ({
    id: mockBookmarkId,
    userId: mockUserId,
    url: 'https://example.com',
    title: 'Example',
    content: null,
    summary: null,
    ogImage: null,
    ogDescription: null,
    status: 'completed',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  const createMockBookmarkWithTags = (overrides?: Partial<BookmarkWithTags>): BookmarkWithTags => ({
    ...createMockBookmark(overrides),
    tags: [],
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock implementations
    vi.mocked(bookmarkRepository.findOrCreateTag).mockImplementation(async (userId, tagName) => ({
      id: `tag-${tagName}`,
      name: tagName,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  });

  describe('list', () => {
    it('should return bookmarks and total count for a user', async () => {
      const mockBookmarks = [createMockBookmarkWithTags(), createMockBookmarkWithTags({ id: 'bookmark-2' })];
      vi.mocked(bookmarkRepository.findManyByUserId).mockResolvedValue(mockBookmarks);
      vi.mocked(bookmarkRepository.countByUserId).mockResolvedValue(2);

      const result = await bookmarkService.list(mockUserId, { page: 1, limit: 20 });

      expect(result).toEqual({
        bookmarks: mockBookmarks,
        total: 2,
      });
      expect(bookmarkRepository.findManyByUserId).toHaveBeenCalledWith(mockUserId, { limit: 20, offset: 0, sortBy: undefined, order: undefined, query: undefined, fromDate: undefined, toDate: undefined });
      expect(bookmarkRepository.countByUserId).toHaveBeenCalledWith(mockUserId, { query: undefined, fromDate: undefined, toDate: undefined });
    });

    it('should calculate correct offset for pagination', async () => {
      vi.mocked(bookmarkRepository.findManyByUserId).mockResolvedValue([]);
      vi.mocked(bookmarkRepository.countByUserId).mockResolvedValue(0);

      await bookmarkService.list(mockUserId, { page: 3, limit: 10 });

      expect(bookmarkRepository.findManyByUserId).toHaveBeenCalledWith(mockUserId, { limit: 10, offset: 20, sortBy: undefined, order: undefined, query: undefined, fromDate: undefined, toDate: undefined });
    });

    it('should handle page 1 correctly (offset 0)', async () => {
      vi.mocked(bookmarkRepository.findManyByUserId).mockResolvedValue([]);
      vi.mocked(bookmarkRepository.countByUserId).mockResolvedValue(0);

      await bookmarkService.list(mockUserId, { page: 1, limit: 20 });

      expect(bookmarkRepository.findManyByUserId).toHaveBeenCalledWith(mockUserId, { limit: 20, offset: 0, sortBy: undefined, order: undefined, query: undefined, fromDate: undefined, toDate: undefined });
    });

    it('should return empty list when user has no bookmarks', async () => {
      vi.mocked(bookmarkRepository.findManyByUserId).mockResolvedValue([]);
      vi.mocked(bookmarkRepository.countByUserId).mockResolvedValue(0);

      const result = await bookmarkService.list(mockUserId, { page: 1, limit: 20 });

      expect(result).toEqual({
        bookmarks: [],
        total: 0,
      });
    });

    it('should pass sort options to repository', async () => {
      vi.mocked(bookmarkRepository.findManyByUserId).mockResolvedValue([]);
      vi.mocked(bookmarkRepository.countByUserId).mockResolvedValue(0);

      await bookmarkService.list(mockUserId, { page: 1, limit: 20, sortBy: 'updatedAt', order: 'asc' });

      expect(bookmarkRepository.findManyByUserId).toHaveBeenCalledWith(mockUserId, { limit: 20, offset: 0, sortBy: 'updatedAt', order: 'asc', query: undefined, fromDate: undefined, toDate: undefined });
    });

    it('should pass search query to repository', async () => {
      vi.mocked(bookmarkRepository.findManyByUserId).mockResolvedValue([]);
      vi.mocked(bookmarkRepository.countByUserId).mockResolvedValue(0);

      await bookmarkService.list(mockUserId, { page: 1, limit: 20, query: 'example' });

      expect(bookmarkRepository.findManyByUserId).toHaveBeenCalledWith(mockUserId, { limit: 20, offset: 0, sortBy: undefined, order: undefined, query: 'example', fromDate: undefined, toDate: undefined });
      expect(bookmarkRepository.countByUserId).toHaveBeenCalledWith(mockUserId, { query: 'example', fromDate: undefined, toDate: undefined });
    });

    it('should pass date filters to repository', async () => {
      vi.mocked(bookmarkRepository.findManyByUserId).mockResolvedValue([]);
      vi.mocked(bookmarkRepository.countByUserId).mockResolvedValue(0);

      const fromDate = new Date('2024-01-01');
      const toDate = new Date('2024-12-31');
      await bookmarkService.list(mockUserId, { page: 1, limit: 20, fromDate, toDate });

      expect(bookmarkRepository.findManyByUserId).toHaveBeenCalledWith(mockUserId, { limit: 20, offset: 0, sortBy: undefined, order: undefined, query: undefined, fromDate, toDate });
      expect(bookmarkRepository.countByUserId).toHaveBeenCalledWith(mockUserId, { query: undefined, fromDate, toDate });
    });

    it('should make parallel calls to repository for performance', async () => {
      vi.mocked(bookmarkRepository.findManyByUserId).mockResolvedValue([]);
      vi.mocked(bookmarkRepository.countByUserId).mockResolvedValue(0);

      await bookmarkService.list(mockUserId, { page: 1, limit: 20 });

      // Both calls should be made in parallel
      expect(bookmarkRepository.findManyByUserId).toHaveBeenCalledTimes(1);
      expect(bookmarkRepository.countByUserId).toHaveBeenCalledTimes(1);
    });
  });

  describe('get', () => {
    it('should return bookmark when it belongs to the user', async () => {
      const mockBookmark = createMockBookmark();
      vi.mocked(bookmarkRepository.findById).mockResolvedValue(mockBookmark);

      const result = await bookmarkService.get(mockBookmarkId, mockUserId);

      expect(result).toEqual(mockBookmark);
      expect(bookmarkRepository.findById).toHaveBeenCalledWith(mockBookmarkId);
    });

    it('should return null when bookmark does not exist', async () => {
      vi.mocked(bookmarkRepository.findById).mockResolvedValue(undefined);

      const result = await bookmarkService.get(mockBookmarkId, mockUserId);

      expect(result).toBeNull();
    });

    it('should return null when bookmark belongs to another user (authorization check)', async () => {
      const mockBookmark = createMockBookmark({ userId: mockOtherUserId });
      vi.mocked(bookmarkRepository.findById).mockResolvedValue(mockBookmark);

      const result = await bookmarkService.get(mockBookmarkId, mockUserId);

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create bookmark with provided title', async () => {
      const input = { url: 'https://example.com', title: 'Custom Title' };
      const mockBookmark = createMockBookmark({ title: 'Custom Title' });
      vi.mocked(bookmarkRepository.create).mockResolvedValue(mockBookmark);

      const result = await bookmarkService.create(mockUserId, input);

      expect(result).toEqual(mockBookmark);
      expect(bookmarkRepository.create).toHaveBeenCalledWith({
        url: 'https://example.com',
        title: 'Custom Title',
        userId: mockUserId,
      });
    });

    it('should use URL as title when title is not provided', async () => {
      const input = { url: 'https://example.com' };
      const mockBookmark = createMockBookmark({ title: 'https://example.com' });
      vi.mocked(bookmarkRepository.create).mockResolvedValue(mockBookmark);

      await bookmarkService.create(mockUserId, input);

      expect(bookmarkRepository.create).toHaveBeenCalledWith({
        url: 'https://example.com',
        title: 'https://example.com',
        userId: mockUserId,
      });
    });

    it('should use URL as title when title is empty string', async () => {
      const input = { url: 'https://example.com', title: '' };
      const mockBookmark = createMockBookmark({ title: 'https://example.com' });
      vi.mocked(bookmarkRepository.create).mockResolvedValue(mockBookmark);

      await bookmarkService.create(mockUserId, input);

      expect(bookmarkRepository.create).toHaveBeenCalledWith({
        url: 'https://example.com',
        title: 'https://example.com',
        userId: mockUserId,
      });
    });

    it('should assign userId to created bookmark', async () => {
      const input = { url: 'https://example.com', title: 'Test' };
      const mockBookmark = createMockBookmark();
      vi.mocked(bookmarkRepository.create).mockResolvedValue(mockBookmark);

      await bookmarkService.create(mockUserId, input);

      expect(bookmarkRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
        })
      );
    });
  });

  describe('update', () => {
    it('should update bookmark when it belongs to the user', async () => {
      const mockBookmark = createMockBookmark();
      const updateData = { title: 'Updated Title' };
      const updatedBookmark = createMockBookmark({ title: 'Updated Title' });

      vi.mocked(bookmarkRepository.findById).mockResolvedValue(mockBookmark);
      vi.mocked(bookmarkRepository.update).mockResolvedValue(updatedBookmark);

      const result = await bookmarkService.update(mockBookmarkId, mockUserId, updateData);

      expect(result).toEqual(updatedBookmark);
      expect(bookmarkRepository.findById).toHaveBeenCalledWith(mockBookmarkId);
      expect(bookmarkRepository.update).toHaveBeenCalledWith(mockBookmarkId, updateData);
    });

    it('should return null when bookmark does not exist', async () => {
      vi.mocked(bookmarkRepository.findById).mockResolvedValue(undefined);

      const result = await bookmarkService.update(mockBookmarkId, mockUserId, { title: 'New' });

      expect(result).toBeNull();
      expect(bookmarkRepository.update).not.toHaveBeenCalled();
    });

    it('should return null when bookmark belongs to another user (authorization check)', async () => {
      const mockBookmark = createMockBookmark({ userId: mockOtherUserId });
      vi.mocked(bookmarkRepository.findById).mockResolvedValue(mockBookmark);

      const result = await bookmarkService.update(mockBookmarkId, mockUserId, { title: 'New' });

      expect(result).toBeNull();
      expect(bookmarkRepository.update).not.toHaveBeenCalled();
    });

    it('should update multiple fields', async () => {
      const mockBookmark = createMockBookmark();
      const updateData = {
        title: 'New Title',
        summary: 'New Summary',
        status: 'completed' as const,
      };
      const updatedBookmark = createMockBookmark(updateData);

      vi.mocked(bookmarkRepository.findById).mockResolvedValue(mockBookmark);
      vi.mocked(bookmarkRepository.update).mockResolvedValue(updatedBookmark);

      await bookmarkService.update(mockBookmarkId, mockUserId, updateData);

      expect(bookmarkRepository.update).toHaveBeenCalledWith(mockBookmarkId, updateData);
    });
  });

  describe('delete', () => {
    it('should delete bookmark when it belongs to the user', async () => {
      const mockBookmark = createMockBookmark();
      vi.mocked(bookmarkRepository.findById).mockResolvedValue(mockBookmark);
      vi.mocked(bookmarkRepository.delete).mockResolvedValue(mockBookmark);

      const result = await bookmarkService.delete(mockBookmarkId, mockUserId);

      expect(result).toEqual(mockBookmark);
      expect(bookmarkRepository.findById).toHaveBeenCalledWith(mockBookmarkId);
      expect(bookmarkRepository.delete).toHaveBeenCalledWith(mockBookmarkId);
    });

    it('should return null when bookmark does not exist', async () => {
      vi.mocked(bookmarkRepository.findById).mockResolvedValue(undefined);

      const result = await bookmarkService.delete(mockBookmarkId, mockUserId);

      expect(result).toBeNull();
      expect(bookmarkRepository.delete).not.toHaveBeenCalled();
    });

    it('should return null when bookmark belongs to another user (authorization check)', async () => {
      const mockBookmark = createMockBookmark({ userId: mockOtherUserId });
      vi.mocked(bookmarkRepository.findById).mockResolvedValue(mockBookmark);

      const result = await bookmarkService.delete(mockBookmarkId, mockUserId);

      expect(result).toBeNull();
      expect(bookmarkRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('Authorization', () => {
    it('should prevent user from accessing another user\'s bookmark (get)', async () => {
      const mockBookmark = createMockBookmark({ userId: mockOtherUserId });
      vi.mocked(bookmarkRepository.findById).mockResolvedValue(mockBookmark);

      const result = await bookmarkService.get(mockBookmarkId, mockUserId);

      expect(result).toBeNull();
    });

    it('should prevent user from updating another user\'s bookmark', async () => {
      const mockBookmark = createMockBookmark({ userId: mockOtherUserId });
      vi.mocked(bookmarkRepository.findById).mockResolvedValue(mockBookmark);

      const result = await bookmarkService.update(mockBookmarkId, mockUserId, { title: 'Hacked' });

      expect(result).toBeNull();
      expect(bookmarkRepository.update).not.toHaveBeenCalled();
    });

    it('should prevent user from deleting another user\'s bookmark', async () => {
      const mockBookmark = createMockBookmark({ userId: mockOtherUserId });
      vi.mocked(bookmarkRepository.findById).mockResolvedValue(mockBookmark);

      const result = await bookmarkService.delete(mockBookmarkId, mockUserId);

      expect(result).toBeNull();
      expect(bookmarkRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('summarize', () => {
    it('should generate summary and update bookmark', async () => {
      const mockBookmark = createMockBookmark();
      const mockContent = 'This is the webpage content...';
      const mockSummary = 'This is a summary of the webpage content.';
      const updatedBookmark = createMockBookmark({ summary: mockSummary, content: mockContent, status: 'completed' });

      vi.mocked(bookmarkRepository.findById).mockResolvedValue(mockBookmark);
      vi.mocked(aiService.fetchWebContent).mockResolvedValue(mockContent);
      vi.mocked(aiService.generateSummary).mockResolvedValue(mockSummary);
      vi.mocked(bookmarkRepository.update).mockResolvedValue(updatedBookmark);

      const result = await bookmarkService.summarize(mockBookmarkId, mockUserId);

      expect(result).toEqual(updatedBookmark);
      expect(aiService.fetchWebContent).toHaveBeenCalledWith(mockBookmark.url);
      expect(aiService.generateSummary).toHaveBeenCalledWith(mockContent);
      expect(bookmarkRepository.update).toHaveBeenCalledWith(mockBookmarkId, {
        summary: mockSummary,
        content: mockContent,
        status: 'completed',
      });
    });

    it('should return null when bookmark does not exist', async () => {
      vi.mocked(bookmarkRepository.findById).mockResolvedValue(undefined);

      const result = await bookmarkService.summarize(mockBookmarkId, mockUserId);

      expect(result).toBeNull();
      expect(aiService.fetchWebContent).not.toHaveBeenCalled();
      expect(aiService.generateSummary).not.toHaveBeenCalled();
    });

    it('should return null when bookmark belongs to another user', async () => {
      const mockBookmark = createMockBookmark({ userId: mockOtherUserId });
      vi.mocked(bookmarkRepository.findById).mockResolvedValue(mockBookmark);

      const result = await bookmarkService.summarize(mockBookmarkId, mockUserId);

      expect(result).toBeNull();
      expect(aiService.fetchWebContent).not.toHaveBeenCalled();
      expect(aiService.generateSummary).not.toHaveBeenCalled();
    });

    it('should handle fetch errors gracefully', async () => {
      const mockBookmark = createMockBookmark();
      vi.mocked(bookmarkRepository.findById).mockResolvedValue(mockBookmark);
      vi.mocked(aiService.fetchWebContent).mockRejectedValue(new Error('Failed to fetch'));

      await expect(bookmarkService.summarize(mockBookmarkId, mockUserId)).rejects.toThrow('Failed to fetch');
      expect(aiService.generateSummary).not.toHaveBeenCalled();
      expect(bookmarkRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('generateTags', () => {
    it('should generate tags and link them to bookmark', async () => {
      const mockBookmark = createMockBookmark({ content: 'Existing content' });
      const mockTagNames = ['JavaScript', 'React', 'Frontend'];
      const updatedBookmark = createMockBookmark({ content: 'Existing content' });

      vi.mocked(bookmarkRepository.findById).mockResolvedValueOnce(mockBookmark);
      vi.mocked(aiService.generateTags).mockResolvedValue(mockTagNames);
      vi.mocked(bookmarkRepository.findById).mockResolvedValueOnce(updatedBookmark);

      const result = await bookmarkService.generateTags(mockBookmarkId, mockUserId);

      expect(result).toEqual({
        bookmark: updatedBookmark,
        tags: mockTagNames,
      });
      expect(aiService.generateTags).toHaveBeenCalledWith('Existing content');
      expect(bookmarkRepository.findOrCreateTag).toHaveBeenCalledTimes(3);
      expect(bookmarkRepository.addTagsToBookmark).toHaveBeenCalledWith(
        mockBookmarkId,
        expect.arrayContaining([expect.any(String)])
      );
    });

    it('should fetch content if not already stored', async () => {
      const mockBookmark = createMockBookmark({ content: null });
      const mockContent = 'Webpage content';
      const mockTagNames = ['Tech', 'News'];
      const updatedBookmark = createMockBookmark({ content: mockContent });

      vi.mocked(bookmarkRepository.findById).mockResolvedValueOnce(mockBookmark);
      vi.mocked(aiService.fetchWebContent).mockResolvedValue(mockContent);
      vi.mocked(aiService.generateTags).mockResolvedValue(mockTagNames);
      vi.mocked(bookmarkRepository.update).mockResolvedValue(mockBookmark);
      vi.mocked(bookmarkRepository.findById).mockResolvedValueOnce(updatedBookmark);

      const result = await bookmarkService.generateTags(mockBookmarkId, mockUserId);

      expect(result).toBeDefined();
      expect(aiService.fetchWebContent).toHaveBeenCalledWith(mockBookmark.url);
      expect(bookmarkRepository.update).toHaveBeenCalledWith(mockBookmarkId, { content: mockContent });
      expect(aiService.generateTags).toHaveBeenCalledWith(mockContent);
    });

    it('should return null when bookmark does not exist', async () => {
      vi.mocked(bookmarkRepository.findById).mockResolvedValue(undefined);

      const result = await bookmarkService.generateTags(mockBookmarkId, mockUserId);

      expect(result).toBeNull();
      expect(aiService.generateTags).not.toHaveBeenCalled();
    });

    it('should return null when bookmark belongs to another user', async () => {
      const mockBookmark = createMockBookmark({ userId: mockOtherUserId });
      vi.mocked(bookmarkRepository.findById).mockResolvedValue(mockBookmark);

      const result = await bookmarkService.generateTags(mockBookmarkId, mockUserId);

      expect(result).toBeNull();
      expect(aiService.generateTags).not.toHaveBeenCalled();
    });

    it('should handle empty tag list', async () => {
      const mockBookmark = createMockBookmark({ content: 'Some content' });
      const updatedBookmark = createMockBookmark({ content: 'Some content' });

      vi.mocked(bookmarkRepository.findById).mockResolvedValueOnce(mockBookmark);
      vi.mocked(aiService.generateTags).mockResolvedValue([]);
      vi.mocked(bookmarkRepository.findById).mockResolvedValueOnce(updatedBookmark);

      const result = await bookmarkService.generateTags(mockBookmarkId, mockUserId);

      expect(result).toEqual({
        bookmark: updatedBookmark,
        tags: [],
      });
      expect(bookmarkRepository.findOrCreateTag).not.toHaveBeenCalled();
      expect(bookmarkRepository.addTagsToBookmark).toHaveBeenCalledWith(mockBookmarkId, []);
    });

    it('should filter out null tags', async () => {
      const mockBookmark = createMockBookmark({ content: 'Some content' });
      const mockTagNames = ['Tag1', 'Tag2'];
      const updatedBookmark = createMockBookmark({ content: 'Some content' });

      vi.mocked(bookmarkRepository.findById).mockResolvedValueOnce(mockBookmark);
      vi.mocked(aiService.generateTags).mockResolvedValue(mockTagNames);
      vi.mocked(bookmarkRepository.findOrCreateTag)
        .mockResolvedValueOnce({ id: 'tag1', name: 'Tag1', userId: mockUserId, createdAt: new Date(), updatedAt: new Date() })
        .mockResolvedValueOnce(null as any); // Simulate null result
      vi.mocked(bookmarkRepository.findById).mockResolvedValueOnce(updatedBookmark);

      const result = await bookmarkService.generateTags(mockBookmarkId, mockUserId);

      expect(result).toBeDefined();
      expect(result?.tags).toHaveLength(1); // Only Tag1 should be included
      expect(bookmarkRepository.addTagsToBookmark).toHaveBeenCalledWith(mockBookmarkId, ['tag1']);
    });
  });
});
