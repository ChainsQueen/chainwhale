import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useWalletAnalysis } from '@/core/hooks/use-wallet-analysis';

describe('useWalletAnalysis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useWalletAnalysis());

    expect(result.current.analysis).toBeNull();
    expect(result.current.holdings).toEqual([]);
    expect(result.current.ensName).toBeUndefined();
    expect(result.current.recentTransactions).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe('');
  });

  it('should fetch wallet analysis successfully', async () => {
    const mockAnalysis = {
      address: '0x123',
      balance: '1000000000000000000',
      tokens: [],
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        analysis: mockAnalysis,
        holdings: [{ symbol: 'ETH', balance: '1.0', value: 2000, chain: 'Ethereum', address: '0x123' }],
        ensName: 'vitalik.eth',
        recentTransactions: [],
      }),
    });

    const { result } = renderHook(() => useWalletAnalysis());

    act(() => {
      result.current.analyzeWallet('vitalik.eth', ['1']);
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.analysis).toEqual(mockAnalysis);
    expect(result.current.holdings).toHaveLength(1);
    expect(result.current.ensName).toBe('vitalik.eth');
  });

  it('should handle API errors gracefully', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const { result } = renderHook(() => useWalletAnalysis());

    act(() => {
      result.current.analyzeWallet('invalid-address', ['1']);
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.analysis).toBeNull();
  });

  it('should set loading state during fetch', async () => {
    (global.fetch as any).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ ok: true, json: async () => ({}) }), 100))
    );

    const { result } = renderHook(() => useWalletAnalysis());

    act(() => {
      result.current.analyzeWallet('0x123', ['1']);
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(true);
    }, { timeout: 50 });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });
});