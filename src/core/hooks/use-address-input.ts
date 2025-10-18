import { useState } from 'react';
import { validateAddress } from '@/core/utils/wallet-utils';

/**
 * Hook to manage address input state and validation
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