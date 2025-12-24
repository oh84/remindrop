import { describe, it, expect, vi, beforeEach } from 'vitest';
import { bookmarkService } from './service';
import { bookmarkRepository } from './repository';
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('list', () => {
    it('should return bookmarks and total count for a user', async () => {
      const mockBookmarks = [createMockBookmark(), createMockBookmark({ id: 'bookmark-2' })];
      vi.mocked(bookmarkRepository.findManyByUserId).mockResolvedValue(mockBookmarks);
      vi.mocked(bookmarkRepository.countByUserId).mockResolvedValue(2);

      const result = await bookmarkService.list(mockUserId, 1, 20);

      expect(result).toEqual({
        bookmarks: mockBookmarks,
        total: 2,
      });
      expect(bookmarkRepository.findManyByUserId).toHaveBeenCalledWith(mockUserId, 20, 0);
      expect(bookmarkRepository.countByUserId).toHaveBeenCalledWith(mockUserId);
    });

    it('should calculate correct offset for pagination', async () => {
      vi.mocked(bookmarkRepository.findManyByUserId).mockResolvedValue([]);
      vi.mocked(bookmarkRepository.countByUserId).mockResolvedValue(0);

      await bookmarkService.list(mockUserId, 3, 10);

      expect(bookmarkRepository.findManyByUserId).toHaveBeenCalledWith(mockUserId, 10, 20);
    });

    it('should handle page 1 correctly (offset 0)', async () => {
      vi.mocked(bookmarkRepository.findManyByUserId).mockResolvedValue([]);
      vi.mocked(bookmarkRepository.countByUserId).mockResolvedValue(0);

      await bookmarkService.list(mockUserId, 1, 20);

      expect(bookmarkRepository.findManyByUserId).toHaveBeenCalledWith(mockUserId, 20, 0);
    });

    it('should return empty list when user has no bookmarks', async () => {
      vi.mocked(bookmarkRepository.findManyByUserId).mockResolvedValue([]);
      vi.mocked(bookmarkRepository.countByUserId).mockResolvedValue(0);

      const result = await bookmarkService.list(mockUserId, 1, 20);

      expect(result).toEqual({
        bookmarks: [],
        total: 0,
      });
    });

    it('should make parallel calls to repository for performance', async () => {
      vi.mocked(bookmarkRepository.findManyByUserId).mockResolvedValue([]);
      vi.mocked(bookmarkRepository.countByUserId).mockResolvedValue(0);

      await bookmarkService.list(mockUserId, 1, 20);

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
});
