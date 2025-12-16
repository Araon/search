import { describe, it, expect, jest } from '@jest/globals';
import { unknownEndpoint, errorHandler, limiter } from '../../utils/middleware.js';

describe('Middleware', () => {
  describe('unknownEndpoint', () => {
    it('should return 404 with error message', () => {
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      unknownEndpoint(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'unknown endpoint' });
    });
  });

  describe('errorHandler', () => {
    it('should handle ValidationError with 400 status', () => {
      const err = {
        name: 'ValidationError',
        message: 'Validation failed',
      };
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      errorHandler(err, req, res, next);

      expect(err.status).toBe(400);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        details: '',
      });
    });

    it('should handle MongoServerError duplicate key with 400 status', () => {
      const err = {
        name: 'MongoServerError',
        message: 'duplicate key error collection',
      };
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      errorHandler(err, req, res, next);

      expect(err.status).toBe(400);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should handle errors with custom status', () => {
      const err = {
        status: 404,
        message: 'Not found',
      };
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Not found',
        details: '',
      });
    });

    it('should handle 500 errors with generic message', () => {
      const err = {
        message: 'Internal error',
      };
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'internal server error',
        details: '',
      });
    });

    it('should include props in response when present', () => {
      const err = {
        status: 400,
        message: 'Bad request',
        props: { field: 'email', reason: 'invalid format' },
      };
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      errorHandler(err, req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        error: 'Bad request',
        details: { field: 'email', reason: 'invalid format' },
      });
    });
  });

  describe('limiter', () => {
    it('should create rate limiter with correct configuration', () => {
      const minutes = 15;
      const limit = 200;
      const rateLimiter = limiter(minutes, limit);

      expect(rateLimiter).toBeDefined();
      expect(typeof rateLimiter).toBe('function');
    });
  });
});

