import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useClipboard } from '@/core/hooks/use-clipboard';

describe('useClipboard', () => {
  beforeEach(() => {
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should initialize with null copiedText', () => {
    const { result } = renderHook(() => useClipboard());

    expect(result.current.copiedText).toBeNull();
  });

  it('should copy text to clipboard', () => {
    const { result } = renderHook(() => useClipboard());

    act(() => {
      result.current.copyToClipboard('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
    expect(result.current.copiedText).toBe('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
  });

  it('should clear copiedText after 2 seconds', () => {
    const { result } = renderHook(() => useClipboard());

    act(() => {
      result.current.copyToClipboard('test-text');
    });

    expect(result.current.copiedText).toBe('test-text');

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.copiedText).toBeNull();
  });

  it('should handle multiple copy operations', () => {
    const { result } = renderHook(() => useClipboard());

    act(() => {
      result.current.copyToClipboard('first-text');
    });
    expect(result.current.copiedText).toBe('first-text');

    // Wait 1 second
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Copy second text (this clears the first timeout and creates a new one)
    act(() => {
      result.current.copyToClipboard('second-text');
    });
    expect(result.current.copiedText).toBe('second-text');

    // Advance 1 more second (1s from second copy)
    // First timeout was cleared, so text should still be 'second-text'
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.copiedText).toBe('second-text');

    // Advance 1 more second (2s total from second copy)
    // Second timeout fires and clears to null
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.copiedText).toBeNull()
  });

  it('should copy empty string', () => {
    const { result } = renderHook(() => useClipboard());

    act(() => {
      result.current.copyToClipboard('');
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('');
    expect(result.current.copiedText).toBe('');
  });

  it('should copy long text', () => {
    const { result } = renderHook(() => useClipboard());
    const longText = 'a'.repeat(1000);

    act(() => {
      result.current.copyToClipboard(longText);
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(longText);
    expect(result.current.copiedText).toBe(longText);
  });

  it('should copy special characters', () => {
    const { result } = renderHook(() => useClipboard());
    const specialText = '!@#$%^&*()_+-={}[]|\\:";\'<>?,./';

    act(() => {
      result.current.copyToClipboard(specialText);
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(specialText);
    expect(result.current.copiedText).toBe(specialText);
  });
});