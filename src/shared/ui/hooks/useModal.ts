import { useState, useCallback } from 'react';

export const useModal = (initialState = false) => {
  const [isOpen, setIsOpen] = useState(initialState);
  const [isLoading, setIsLoading] = useState(false);
  
  const open = useCallback(() => setIsOpen(true), []);
  
  const close = useCallback(() => {
    setIsOpen(false);
    setIsLoading(false);
  }, []);
  
  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);
  
  return { 
    isOpen, 
    isLoading, 
    open, 
    close, 
    setLoading 
  };
}; 