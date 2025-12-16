import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Create mock functions
const mockFind = jest.fn();
const mockFindOne = jest.fn();
const mockSelect = jest.fn();
const mockSkip = jest.fn();
const mockLimit = jest.fn();

// Mock the Anime model
jest.unstable_mockModule('../../models/anime.model.js', () => ({
  default: {
    find: mockFind,
    findOne: mockFindOne,
  },
}));

// Mock Chroma
const mockQuery = jest.fn();
const mockBulkUpsert = jest.fn();

jest.unstable_mockModule('../../utils/chroma.js', () => ({
  default: {
    query: mockQuery,
    bulkUpsert: mockBulkUpsert,
  },
}));

// Import the service after mocking
const AnimeService = (await import('../../services/anime.services.js')).default;

describe('AnimeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock chain
    mockSelect.mockReturnThis();
    mockSkip.mockReturnThis();
    mockLimit.mockReturnThis();
  });

  describe('FindAnimeById', () => {
    it('should find animes by IDs', async () => {
      const mockIds = ['123', '456'];
      const mockAnimes = [
        {
          id: '123',
          title: 'Anime 1',
          synonyms: ['Synonym 1'],
          picture: 'https://example.com/pic1.jpg',
        },
        {
          id: '456',
          title: 'Anime 2',
          synonyms: ['Synonym 2'],
          picture: 'https://example.com/pic2.jpg',
        },
      ];

      mockSelect.mockResolvedValue(mockAnimes);
      mockFind.mockReturnValue({ select: mockSelect });

      const result = await AnimeService.FindAnimeById(mockIds);

      expect(mockFind).toHaveBeenCalledWith({
        _id: { $in: mockIds },
      });
      expect(result).toEqual(mockAnimes);
    });

    it('should return empty array when no animes found', async () => {
      mockSelect.mockResolvedValue([]);
      mockFind.mockReturnValue({ select: mockSelect });

      const result = await AnimeService.FindAnimeById(['123']);

      expect(result).toEqual([]);
    });
  });

  describe('FindOne', () => {
    it('should find one anime', async () => {
      const mockAnime = {
        id: '123',
        title: 'Test Anime',
        synonyms: ['Test'],
        picture: 'https://example.com/pic.jpg',
      };

      mockSelect.mockResolvedValue(mockAnime);
      mockFindOne.mockReturnValue({ select: mockSelect });

      const result = await AnimeService.FindOne();

      expect(mockFindOne).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockAnime);
    });
  });

  describe('FuzzySearch', () => {
    it('should perform fuzzy search by title', async () => {
      const searchString = 'naruto';
      const mockResults = [
        {
          id: '123',
          title: 'Naruto',
          synonyms: ['Naruto'],
          picture: 'https://example.com/pic.jpg',
        },
      ];

      mockSelect.mockResolvedValue(mockResults);
      mockFind.mockReturnValue({ select: mockSelect });

      const result = await AnimeService.FuzzySearch(searchString);

      expect(mockFind).toHaveBeenCalled();
      expect(result).toEqual(mockResults);
    });

    it('should perform fuzzy search by plot', async () => {
      const searchString = 'ninja';
      const mockResults = [
        {
          id: '123',
          title: 'Naruto',
          synonyms: ['Naruto'],
          picture: 'https://example.com/pic.jpg',
        },
      ];

      mockSelect.mockResolvedValue(mockResults);
      mockFind.mockReturnValue({ select: mockSelect });

      const result = await AnimeService.FuzzySearch(searchString);

      expect(mockFind).toHaveBeenCalled();
      expect(result).toEqual(mockResults);
    });

    it('should handle errors during fuzzy search', async () => {
      const searchString = 'test';
      const error = new Error('Database error');

      mockSelect.mockRejectedValue(error);
      mockFind.mockReturnValue({ select: mockSelect });

      await expect(AnimeService.FuzzySearch(searchString)).rejects.toThrow(
        'Database error'
      );
    });
  });

  describe('SemanticSearch', () => {
    it('should perform semantic search and return ordered results', async () => {
      const searchString = 'ninja anime';
      const mockChromaResults = {
        ids: [['123', '456']],
        distances: [[0.5, 0.8]],
      };
      const mockAnimes = [
        {
          _id: { toString: () => '123' },
          id: '123',
          title: 'Naruto',
          picture: 'https://example.com/pic1.jpg',
        },
        {
          _id: { toString: () => '456' },
          id: '456',
          title: 'Boruto',
          picture: 'https://example.com/pic2.jpg',
        },
      ];

      mockQuery.mockResolvedValue(mockChromaResults);
      mockSelect.mockResolvedValue(mockAnimes);
      mockFind.mockReturnValue({ select: mockSelect });

      const result = await AnimeService.SemanticSearch(searchString);

      expect(mockQuery).toHaveBeenCalledWith({ q: searchString, n: 10 });
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('title', 'Naruto');
      expect(result[0]).toHaveProperty('distance', 0.5);
      expect(result[0]).toHaveProperty('similarity');
    });

    it('should return empty array when no results from ChromaDB', async () => {
      const searchString = 'test';
      mockQuery.mockResolvedValue(null);

      const result = await AnimeService.SemanticSearch(searchString);

      expect(result).toEqual([]);
    });

    it('should return empty array when ChromaDB returns empty results', async () => {
      const searchString = 'test';
      mockQuery.mockResolvedValue({
        ids: [],
        distances: [],
      });

      const result = await AnimeService.SemanticSearch(searchString);

      expect(result).toEqual([]);
    });

    it('should filter out animes without titles', async () => {
      const searchString = 'test';
      const mockChromaResults = {
        ids: [['123', '456']],
        distances: [[0.5, 0.8]],
      };
      const mockAnimes = [
        {
          _id: { toString: () => '123' },
          id: '123',
          title: 'Naruto',
          picture: 'https://example.com/pic1.jpg',
        },
        {
          _id: { toString: () => '456' },
          id: '456',
          title: null,
          picture: 'https://example.com/pic2.jpg',
        },
      ];

      mockQuery.mockResolvedValue(mockChromaResults);
      mockSelect.mockResolvedValue(mockAnimes);
      mockFind.mockReturnValue({ select: mockSelect });

      const result = await AnimeService.SemanticSearch(searchString);

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Naruto');
    });
  });

  describe('FeedAnimeToVectorStore', () => {
    it('should feed animes to vector store in batches', async () => {
      const mockAnimes = [
        {
          _id: { toString: () => '123' },
          title: 'Anime 1',
          episodes: 12,
          status: 'Completed',
          animeSeason: { season: 'Spring', year: 2020 },
          tags: ['Action', 'Adventure'],
          synonyms: ['Synonym 1'],
          relatedAnime: [],
          type: 'TV',
        },
      ];

      let callCount = 0;
      mockSelect.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve(mockAnimes);
        }
        return Promise.resolve([]);
      });
      mockLimit.mockReturnValue({ select: mockSelect });
      mockSkip.mockReturnValue({ limit: mockLimit });
      mockFind.mockReturnValue({ skip: mockSkip });

      mockBulkUpsert.mockResolvedValue(undefined);

      await AnimeService.FeedAnimeToVectorStore();

      expect(mockBulkUpsert).toHaveBeenCalled();
    });

    it('should handle errors during feed process', async () => {
      const error = new Error('ChromaDB error');
      mockSelect.mockRejectedValue(error);
      mockLimit.mockReturnValue({ select: mockSelect });
      mockSkip.mockReturnValue({ limit: mockLimit });
      mockFind.mockReturnValue({ skip: mockSkip });

      await expect(AnimeService.FeedAnimeToVectorStore()).rejects.toThrow(
        'ChromaDB error'
      );
    });
  });
});
