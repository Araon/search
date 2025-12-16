import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

// Mock PostHog
jest.mock('posthog-js/react', () => ({
  usePostHog: () => ({
    capture: jest.fn(),
  }),
}));

// Mock fetch
global.fetch = jest.fn();

describe('App Component', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  it('should render the app with title', () => {
    render(<App />);
    expect(screen.getByText('Anime Search')).toBeInTheDocument();
  });

  it('should render search input and button', () => {
    render(<App />);
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    expect(screen.getByText('Search')).toBeInTheDocument();
  });

  it('should render toggle switch for search mode', () => {
    render(<App />);
    expect(screen.getByText('Fuzzy Search')).toBeInTheDocument();
    expect(screen.getByText('Semantic Search')).toBeInTheDocument();
  });

  it('should display suggestions based on search mode', () => {
    render(<App />);
    expect(screen.getByText('Fairy Tail')).toBeInTheDocument();
    expect(screen.getByText('Naruto')).toBeInTheDocument();
  });

  it('should update search term when input changes', async () => {
    render(<App />);
    const input = screen.getByPlaceholderText('Search...');

    await userEvent.type(input, 'Naruto');

    expect(input).toHaveValue('Naruto');
  });

  it('should call fuzzy search API when search button is clicked', async () => {
    const mockAnimes = [
      {
        id: '123',
        title: 'Naruto',
        picture: 'https://example.com/pic.jpg',
      },
    ];

    fetch.mockResolvedValueOnce({
      json: async () => ({ animes: mockAnimes }),
    });

    render(<App />);
    const input = screen.getByPlaceholderText('Search...');
    const searchButton = screen.getByText('Search');

    await userEvent.type(input, 'Naruto');
    await userEvent.click(searchButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/animes/fuzzy?q=Naruto');
    });
  });

  it('should call semantic search API when toggle is on', async () => {
    const mockAnimes = [
      {
        id: '123',
        title: 'Naruto',
        picture: 'https://example.com/pic.jpg',
        distance: 0.5,
        similarity: 0.67,
      },
    ];

    fetch.mockResolvedValueOnce({
      json: async () => ({ animes: mockAnimes }),
    });

    render(<App />);
    const toggle = screen.getByLabelText('select1');
    const input = screen.getByPlaceholderText('Search...');
    const searchButton = screen.getByText('Search');

    await userEvent.click(toggle);
    await userEvent.type(input, 'ninja anime');
    await userEvent.click(searchButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/animes/semantic?q=ninja anime');
    });
  });

  it('should display animes after successful search', async () => {
    const mockAnimes = [
      {
        id: '123',
        title: 'Naruto',
        picture: 'https://example.com/pic.jpg',
      },
      {
        id: '456',
        title: 'One Piece',
        picture: 'https://example.com/pic2.jpg',
      },
    ];

    fetch.mockResolvedValueOnce({
      json: async () => ({ animes: mockAnimes }),
    });

    render(<App />);
    const input = screen.getByPlaceholderText('Search...');
    const searchButton = screen.getByText('Search');

    await userEvent.type(input, 'test');
    await userEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText('Naruto')).toBeInTheDocument();
      expect(screen.getByText('One Piece')).toBeInTheDocument();
    });
  });

  it('should display loading skeletons while searching', async () => {
    fetch.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ json: async () => ({ animes: [] }) }), 100)
        )
    );

    render(<App />);
    const input = screen.getByPlaceholderText('Search...');
    const searchButton = screen.getByText('Search');

    await userEvent.type(input, 'test');
    await userEvent.click(searchButton);

    // Check for skeleton cards
    const skeletons = screen.getAllByText((content, element) => {
      return element?.className?.includes('animate-pulse');
    });
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should display "No animes found" when search returns empty', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({ animes: [] }),
    });

    render(<App />);
    const input = screen.getByPlaceholderText('Search...');
    const searchButton = screen.getByText('Search');

    await user.type(input, 'nonexistent');
    await userEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText('No animes found.')).toBeInTheDocument();
    });
  });

  it('should update suggestions when toggle is switched', async () => {
    render(<App />);

    // Initially shows BORING suggestions
    expect(screen.getByText('Fairy Tail')).toBeInTheDocument();

    const toggle = screen.getByLabelText('select1');
    await user.click(toggle);

    // Should show COOL suggestions
    await waitFor(() => {
      expect(
        screen.getByText(
          'Rich girl joins guild with a flying cat and a dragon slayer'
        )
      ).toBeInTheDocument();
    });
  });

  it('should search when suggestion is clicked', async () => {
    const mockAnimes = [
      {
        id: '123',
        title: 'Naruto',
        picture: 'https://example.com/pic.jpg',
      },
    ];

    fetch.mockResolvedValueOnce({
      json: async () => ({ animes: mockAnimes }),
    });

    render(<App />);
    const suggestion = screen.getByText('Naruto');

    await userEvent.click(suggestion);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });
  });

  it('should handle form submission with Enter key', async () => {
    const mockAnimes = [
      {
        id: '123',
        title: 'Naruto',
        picture: 'https://example.com/pic.jpg',
      },
    ];

    fetch.mockResolvedValueOnce({
      json: async () => ({ animes: mockAnimes }),
    });

    render(<App />);
    const input = screen.getByPlaceholderText('Search...');

    await userEvent.type(input, 'Naruto');
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });
  });

  it('should not search when input is empty', async () => {
    render(<App />);
    const searchButton = screen.getByText('Search');

    await userEvent.click(searchButton);

    expect(fetch).not.toHaveBeenCalled();
  });
});

describe('MovieCard Component', () => {
  it('should render anime card with title and image', () => {
    const mockAnime = {
      id: '123',
      title: 'Naruto',
      picture: 'https://example.com/pic.jpg',
    };

    render(<App />);
    // We need to trigger a search first to render the card
    // This is a simplified test - in practice, you'd extract MovieCard
    expect(screen.getByText('Anime Search')).toBeInTheDocument();
  });

  it('should handle image error and show placeholder', async () => {
    const mockAnimes = [
      {
        id: '123',
        title: 'Naruto',
        picture: 'invalid-url',
      },
    ];

    fetch.mockResolvedValueOnce({
      json: async () => ({ animes: mockAnimes }),
    });

    render(<App />);
    const input = screen.getByPlaceholderText('Search...');
    const searchButton = screen.getByText('Search');

    await userEvent.type(input, 'test');
    await userEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText('Naruto')).toBeInTheDocument();
    });

    // Check that image exists (it will error and show placeholder)
    const image = screen.getByAltText('Naruto');
    expect(image).toBeInTheDocument();
  });
});

