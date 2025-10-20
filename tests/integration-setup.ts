import { vi } from 'vitest';

// Mock environment variables for integration tests
process.env.NODE_ENV = 'test';
process.env.BLOCKSCOUT_USE_HTTP = 'true'; // Use HTTP client for tests

// Mock fetch for integration tests
global.fetch = vi.fn();