import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useApiKey } from '@/core/hooks/use-api-key';

describe('useApiKey', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should initialize with no API key', () => {
    const { result } = renderHook(() => useApiKey());

    expect(result.current.apiKey).toBe('');
    expect(result.current.hasApiKey).toBe(false);
  });

  it('should load API key from localStorage on mount', () => {
    localStorage.setItem('openai_api_key', 'sk-test123');

    const { result } = renderHook(() => useApiKey());

    expect(result.current.apiKey).toBe('sk-test123');
    expect(result.current.hasApiKey).toBe(true);
  });

  it('should save API key to localStorage', () => {
    const { result } = renderHook(() => useApiKey());

    act(() => {
      result.current.setApiKey('sk-newkey456');
    });

    expect(result.current.apiKey).toBe('sk-newkey456');
    expect(result.current.hasApiKey).toBe(true);
    expect(localStorage.setItem).toHaveBeenCalledWith('openai_api_key', 'sk-newkey456');
  });

  it('should remove API key from localStorage', () => {
    localStorage.setItem('openai_api_key', 'sk-test123');

    const { result } = renderHook(() => useApiKey());

    act(() => {
      result.current.removeApiKey();
    });

    expect(result.current.apiKey).toBe('');
    expect(result.current.hasApiKey).toBe(false);
    expect(localStorage.removeItem).toHaveBeenCalledWith('openai_api_key');
  });
});