import { useState } from 'react';
import { validateAddress } from '@/core/utils/wallet-utils';

/**
 * Custom hook for managing wallet address input with real-time validation
 * 
 * Provides state management for address input field with automatic validation
 * for Ethereum addresses and ENS names. Validates on every change and maintains
 * validation state.
 * 
 * @returns Object containing address state and validation utilities
 * @returns {string} address - Current address input value
 * @returns {boolean} isValidAddress - Whether the current address is valid
 * @returns {function} handleAddressChange - Handler for address input changes with validation
 * @returns {function} setAddress - Direct setter for address (bypasses validation)
 * 
 * @example
 * function WalletInput() {
 *   const { address, isValidAddress, handleAddressChange } = useAddressInput();
 *   
 *   return (
 *     <input
 *       value={address}
 *       onChange={(e) => handleAddressChange(e.target.value)}
 *       className={!isValidAddress ? 'error' : ''}
 *     />
 *   );
 * }
 */
export function useAddressInput() {
  const [address, setAddress] = useState('');
  const [isValidAddress, setIsValidAddress] = useState(true);

  const handleAddressChange = (value: string) => {
    setAddress(value);
    
    if (value.trim()) {
      setIsValidAddress(validateAddress(value.trim()));
    } else {
      setIsValidAddress(true);
    }
  };

  return {
    address,
    isValidAddress,
    handleAddressChange,
    setAddress,
  };
}