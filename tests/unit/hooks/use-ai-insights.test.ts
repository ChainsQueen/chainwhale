import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAiInsights } from '@/core/hooks/use-ai-insights';

// Mock fetch globally
global.fetch = vi.fn();

describe('useAiInsights', () => {
  const mockWalletData = {
    address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    holdings: [
      { symbol: 'ETH', balance: '10', value: 20000, chain: '1', address: '0x...' },
      { symbol: 'USDC', balance: '5000', value: 5000, chain: '1', address: '0x...' },
    ],
    recentTransactions: [{ hash: '0x123', value: '1000' }],
    totalValue: 25000,
    chains: { '1': 25000 },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useAiInsights());

    expect(result.current.aiInsights).toBeNull();
    expect(result.current.isGenerating).toBe(false);
    expect(result.current.error).toBe('');
  });

  it('should generate insights successfully', async () => {
    const mockResponse = {
      insights: 'This wallet shows strong DeFi activity',
      riskScore: 3,
      summary: 'Low risk portfolio',
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    // Mock localStorage to return the API key
    vi.mocked(localStorage.getItem).mockReturnValue('sk-test123');

    const { result } = renderHook(() => useAiInsights());

    let returnValue;
    await act(async () => {
      returnValue = await result.current.generateInsights(mockWalletData);
    });

    await waitFor(() => {
      expect(result.current.aiInsights).toBe('This wallet shows strong DeFi activity');
      expect(result.current.isGenerating).toBe(false);
      expect(result.current.error).toBe('');
    });

    expect(returnValue).toEqual({
      riskScore: 3,
      summary: 'Low risk portfolio',
    });

    expect(fetch).toHaveBeenCalledWith('/api/analyze-wallet-ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...mockWalletData, apiKey: 'sk-test123' }),
    });
  });

  it('should handle API errors', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);

    const { result } = renderHook(() => useAiInsights());

    await act(async () => {
      try {
        await result.current.generateInsights(mockWalletData);
      } catch (err) {
        // Expected to throw
      }
    });

    await waitFor(() => {
      expect(result.current.error).toBe('Failed to generate AI insights. Make sure OpenAI API key is configured.');
      expect(result.current.isGenerating).toBe(false);
    });
  });

  it('should handle network errors', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useAiInsights());

    await act(async () => {
      try {
        await result.current.generateInsights(mockWalletData);
      } catch (err) {
        // Expected to throw
      }
    });

    await waitFor(() => {
      expect(result.current.error).toBe('Failed to generate AI insights. Make sure OpenAI API key is configured.');
      expect(result.current.isGenerating).toBe(false);
    });
  });

  it('should set isGenerating to true during generation', async () => {
    vi.mocked(fetch).mockImplementationOnce(() => 
      new Promise((resolve) => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ insights: 'Test', riskScore: 2, summary: 'Test' }),
      } as Response), 100))
    );

    const { result } = renderHook(() => useAiInsights());

    act(() => {
      result.current.generateInsights(mockWalletData);
    });

    expect(result.current.isGenerating).toBe(true);

    await waitFor(() => {
      expect(result.current.isGenerating).toBe(false);
    }, { timeout: 200 });
  });

  it('should include API key from localStorage in request', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ insights: 'Test', riskScore: 1, summary: 'Test' }),
    } as Response);

    // Mock localStorage to return the API key
    vi.mocked(localStorage.getItem).mockReturnValue('sk-custom-key');

    const { result } = renderHook(() => useAiInsights());

    await act(async () => {
      await result.current.generateInsights(mockWalletData);
    });

    const fetchCall = vi.mocked(fetch).mock.calls[0];
    const requestBody = JSON.parse(fetchCall[1]?.body as string);
    expect(requestBody.apiKey).toBe('sk-custom-key');
  });

  it('should clear error on successful generation after previous error', async () => {
    const { result } = renderHook(() => useAiInsights());

    // First call fails
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
    } as Response);

    await act(async () => {
      try {
        await result.current.generateInsights(mockWalletData);
      } catch (err) {
        // Expected
      }
    });

    expect(result.current.error).toBeTruthy();

    // Second call succeeds
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ insights: 'Success', riskScore: 2, summary: 'Good' }),
    } as Response);

    await act(async () => {
      await result.current.generateInsights(mockWalletData);
    });

    await waitFor(() => {
      expect(result.current.error).toBe('');
      expect(result.current.aiInsights).toBe('Success');
    });
  });
});