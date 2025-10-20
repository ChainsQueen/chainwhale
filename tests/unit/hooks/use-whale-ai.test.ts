import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useWhaleAI } from '@/core/hooks/use-whale-ai';

// Mock fetch
global.fetch = vi.fn();

// Mock window.location
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (window as any).location;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
window.location = { href: '' } as any;

// TODO: Fix localStorage API key detection in test environment
describe.skip('useWhaleAI', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    window.location.href = '';
  });

  it('initializes with no insights', () => {
    const { result } = renderHook(() => useWhaleAI());

    expect(result.current.aiInsights).toBeNull();
    expect(result.current.isGenerating).toBe(false);
    expect(result.current.hasApiKey).toBe(false);
  });

  it('detects API key from localStorage', async () => {
    localStorage.setItem('ai_api_key', 'sk-test123');

    const { result } = renderHook(() => useWhaleAI());

    await waitFor(() => {
      expect(result.current.hasApiKey).toBe(true);
    });
  });

  it('detects legacy openai_api_key from localStorage', async () => {
    localStorage.setItem('openai_api_key', 'sk-legacy123');

    const { result } = renderHook(() => useWhaleAI());

    await waitFor(() => {
      expect(result.current.hasApiKey).toBe(true);
    });
  });

  it('generates AI insights successfully', async () => {
    localStorage.setItem('ai_api_key', 'sk-test123');
    
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ insights: 'AI generated insights here' }),
    } as Response);

    const { result } = renderHook(() => useWhaleAI());

    // Wait for useEffect to detect API key
    await waitFor(() => {
      expect(result.current.hasApiKey).toBe(true);
    });

    await act(async () => {
      await result.current.generateInsights({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        transfers: [{ hash: '0x123' } as any],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        stats: { totalVolume: 1000000 } as any,
        topWhales: [],
        timeRange: '1h',
        selectedChains: ['1'],
        minValue: 100000,
        tokenFilter: '',
        dataSourceStats: null,
      });
    });

    expect(result.current.aiInsights).toBe('AI generated insights here');
    expect(result.current.isGenerating).toBe(false);
  });

  it('redirects to settings when no API key', async () => {
    const { result } = renderHook(() => useWhaleAI());

    await act(async () => {
      await result.current.generateInsights({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        transfers: [{ hash: '0x123' } as any],
        stats: null,
        topWhales: [],
        timeRange: '1h',
        selectedChains: ['1'],
        minValue: 100000,
        tokenFilter: '',
        dataSourceStats: null,
      });
    });

    expect(window.location.href).toBe('/dashboard?tab=settings');
  });

  it('does not generate when no transfers', async () => {
    localStorage.setItem('ai_api_key', 'sk-test123');

    const { result } = renderHook(() => useWhaleAI());

    await act(async () => {
      await result.current.generateInsights({
        transfers: [],
        stats: null,
        topWhales: [],
        timeRange: '1h',
        selectedChains: ['1'],
        minValue: 100000,
        tokenFilter: '',
        dataSourceStats: null,
      });
    });

    expect(fetch).not.toHaveBeenCalled();
  });

  it('handles API errors', async () => {
    localStorage.setItem('ai_api_key', 'sk-test123');
    
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
    } as Response);

    const { result } = renderHook(() => useWhaleAI());

    // Wait for useEffect to detect API key
    await waitFor(() => {
      expect(result.current.hasApiKey).toBe(true);
    });

    let error: Error | undefined;
    await act(async () => {
      try {
        await result.current.generateInsights({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          transfers: [{ hash: '0x123' } as any],
          stats: null,
          topWhales: [],
          timeRange: '1h',
          selectedChains: ['1'],
          minValue: 100000,
          tokenFilter: '',
          dataSourceStats: null,
        });
      } catch (err) {
        error = err as Error;
      }
    });

    expect(error).toBeDefined();
    expect(error?.message).toContain('Failed to generate AI insights');
    expect(result.current.isGenerating).toBe(false);
  });

  it('clears insights', async () => {
    localStorage.setItem('ai_api_key', 'sk-test123');
    
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ insights: 'Some insights' }),
    } as Response);

    const { result } = renderHook(() => useWhaleAI());

    // Wait for useEffect to detect API key
    await waitFor(() => {
      expect(result.current.hasApiKey).toBe(true);
    });

    // First generate insights
    await act(async () => {
      await result.current.generateInsights({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        transfers: [{ hash: '0x123' } as any],
        stats: null,
        topWhales: [],
        timeRange: '1h',
        selectedChains: ['1'],
        minValue: 100000,
        tokenFilter: '',
        dataSourceStats: null,
      });
    });

    expect(result.current.aiInsights).toBe('Some insights');

    // Then clear them
    act(() => {
      result.current.clearInsights();
    });

    expect(result.current.aiInsights).toBeNull();
  });

  it('sends correct payload to API', async () => {
    localStorage.setItem('ai_api_key', 'sk-test123');
    
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ insights: 'test' }),
    } as Response);

    const { result } = renderHook(() => useWhaleAI());

    // Wait for useEffect to detect API key
    await waitFor(() => {
      expect(result.current.hasApiKey).toBe(true);
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockTransfers = [{ hash: '0x1' }, { hash: '0x2' }] as any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockTopWhales = [{ address: '0xa' }, { address: '0xb' }] as any[];

    await act(async () => {
      await result.current.generateInsights({
        transfers: mockTransfers,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        stats: { totalVolume: 5000000 } as any,
        topWhales: mockTopWhales,
        timeRange: '6h',
        selectedChains: ['1', '8453'],
        minValue: 500000,
        tokenFilter: 'USDC',
        dataSourceStats: { mcp: 5, http: 5, total: 10 },
      });
    });

    expect(fetch).toHaveBeenCalledWith(
      '/api/whale-tracker/analyze-ai',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"timeRange":"6h"'),
      })
    );
  });
});