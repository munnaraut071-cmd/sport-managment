import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient, api, ApiError } from '@/lib/api';
import MockAdapter from 'axios-mock-adapter';

describe('API Service', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(apiClient);
    localStorage.clear();
  });

  describe('Authentication', () => {
    it('should login successfully', async () => {
      const mockUser = {
        _id: '1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'user'
      };

      mock.onPost('/auth/login').reply(200, {
        success: true,
        token: 'mock-token',
        user: mockUser
      });

      const result = await api.auth.login({
        email: 'test@example.com',
        password: 'password123'
      });

      expect(result.token).toBe('mock-token');
      expect(result.user).toEqual(mockUser);
    });

    it('should handle login failure', async () => {
      mock.onPost('/auth/login').reply(401, {
        success: false,
        message: 'Invalid credentials'
      });

      await expect(
        api.auth.login({ email: 'test@example.com', password: 'wrong' })
      ).rejects.toThrow();
    });

    it('should register successfully', async () => {
      const mockUser = {
        _id: '1',
        name: 'New User',
        email: 'new@example.com',
        role: 'user'
      };

      mock.onPost('/auth/register').reply(201, {
        success: true,
        token: 'mock-token',
        user: mockUser
      });

      const result = await api.auth.register({
        name: 'New User',
        email: 'new@example.com',
        password: 'Password123!'
      });

      expect(result.user).toEqual(mockUser);
    });
  });

  describe('Kits API', () => {
    it('should fetch all kits', async () => {
      const mockKits = [
        { _id: '1', name: 'Kit 1', category: 'Cricket', quantity: 10 },
        { _id: '2', name: 'Kit 2', category: 'Football', quantity: 15 }
      ];

      mock.onGet('/kits').reply(200, {
        success: true,
        data: mockKits
      });

      const result = await api.kits.getAll();
      expect(result).toEqual(mockKits);
    });

    it('should create a kit', async () => {
      const newKit = {
        name: 'New Kit',
        category: 'Tennis',
        quantity: 5
      };

      mock.onPost('/kits').reply(201, {
        success: true,
        data: { _id: '3', ...newKit }
      });

      const result = await api.kits.create(newKit);
      expect(result.name).toBe(newKit.name);
    });
  });

  describe('Error Handling', () => {
    it('should handle 401 unauthorized', async () => {
      mock.onGet('/auth/me').reply(401, {
        success: false,
        message: 'Unauthorized'
      });

      await expect(api.auth.me()).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      mock.onGet('/kits').networkError();

      await expect(api.kits.getAll()).rejects.toThrow();
    });

    it('should handle timeout errors', async () => {
      mock.onGet('/kits').timeout();

      await expect(api.kits.getAll()).rejects.toThrow();
    });
  });
});
