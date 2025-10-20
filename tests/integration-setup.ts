import { vi } from 'vitest';

// Mock environment variables for integration tests
// NODE_ENV is already set to 'test' by Vitest
process.env.BLOCKSCOUT_USE_HTTP = 'true'; // Use HTTP client for tests

// Mock fetch for integration tests
global.fetch = vi.fn();