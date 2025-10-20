import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAddressInput } from '@/core/hooks/use-address-input';
import * as walletUtils from '@/core/utils/wallet-utils';

vi.mock('@/core/utils/wallet-utils', () => ({
  validateAddress: vi.fn(),
}));

describe('useAddressInput', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with empty address and valid state', () => {
    const { result } = renderHook(() => useAddressInput());

    expect(result.current.address).toBe('');
    expect(result.current.isValidAddress).toBe(true);
  });

  it('should update address and validate on change', () => {
    vi.mocked(walletUtils.validateAddress).mockReturnValue(true);
    const { result } = renderHook(() => useAddressInput());

    act(() => {
      result.current.handleAddressChange('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
    });

    expect(result.current.address).toBe('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
    expect(result.current.isValidAddress).toBe(true);
    expect(walletUtils.validateAddress).toHaveBeenCalledWith('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
  });

  it('should mark invalid addresses as invalid', () => {
    vi.mocked(walletUtils.validateAddress).mockReturnValue(false);
    const { result } = renderHook(() => useAddressInput());

    act(() => {
      result.current.handleAddressChange('invalid-address');
    });

    expect(result.current.address).toBe('invalid-address');
    expect(result.current.isValidAddress).toBe(false);
    expect(walletUtils.validateAddress).toHaveBeenCalledWith('invalid-address');
  });

  it('should trim whitespace before validation', () => {
    vi.mocked(walletUtils.validateAddress).mockReturnValue(true);
    const { result } = renderHook(() => useAddressInput());

    act(() => {
      result.current.handleAddressChange('  0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb  ');
    });

    expect(result.current.address).toBe('  0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb  ');
    expect(walletUtils.validateAddress).toHaveBeenCalledWith('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
  });

  it('should mark empty input as valid', () => {
    const { result } = renderHook(() => useAddressInput());

    act(() => {
      result.current.handleAddressChange('');
    });

    expect(result.current.address).toBe('');
    expect(result.current.isValidAddress).toBe(true);
    expect(walletUtils.validateAddress).not.toHaveBeenCalled();
  });

  it('should mark whitespace-only input as valid', () => {
    const { result } = renderHook(() => useAddressInput());

    act(() => {
      result.current.handleAddressChange('   ');
    });

    expect(result.current.address).toBe('   ');
    expect(result.current.isValidAddress).toBe(true);
    expect(walletUtils.validateAddress).not.toHaveBeenCalled();
  });

  it('should validate ENS names', () => {
    vi.mocked(walletUtils.validateAddress).mockReturnValue(true);
    const { result } = renderHook(() => useAddressInput());

    act(() => {
      result.current.handleAddressChange('vitalik.eth');
    });

    expect(result.current.address).toBe('vitalik.eth');
    expect(result.current.isValidAddress).toBe(true);
    expect(walletUtils.validateAddress).toHaveBeenCalledWith('vitalik.eth');
  });

  it('should allow direct address setting via setAddress', () => {
    const { result } = renderHook(() => useAddressInput());

    act(() => {
      result.current.setAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
    });

    expect(result.current.address).toBe('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
    expect(walletUtils.validateAddress).not.toHaveBeenCalled();
  });

  it('should handle multiple consecutive changes', () => {
    vi.mocked(walletUtils.validateAddress)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);
    const { result } = renderHook(() => useAddressInput());

    act(() => {
      result.current.handleAddressChange('invalid');
    });
    expect(result.current.isValidAddress).toBe(false);

    act(() => {
      result.current.handleAddressChange('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
    });
    expect(result.current.isValidAddress).toBe(true);
  });

  it('should reset to valid when clearing invalid address', () => {
    vi.mocked(walletUtils.validateAddress).mockReturnValue(false);
    const { result } = renderHook(() => useAddressInput());

    act(() => {
      result.current.handleAddressChange('invalid');
    });
    expect(result.current.isValidAddress).toBe(false);

    act(() => {
      result.current.handleAddressChange('');
    });
    expect(result.current.isValidAddress).toBe(true);
  });
});