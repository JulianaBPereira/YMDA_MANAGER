import React, { createContext, useContext } from 'react';

type VirtualKeyboardContextValue = {
  // Adapte conforme necessidade; no momento, apenas stub para não quebrar
};

const VirtualKeyboardContext = createContext<VirtualKeyboardContextValue | undefined>(undefined);

export const VirtualKeyboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const value: VirtualKeyboardContextValue = {};
  return <VirtualKeyboardContext.Provider value={value}>{children}</VirtualKeyboardContext.Provider>;
};

export function useVirtualKeyboard(): VirtualKeyboardContextValue {
  const ctx = useContext(VirtualKeyboardContext);
  if (!ctx) {
    throw new Error('useVirtualKeyboard must be used within a VirtualKeyboardProvider');
  }
  return ctx;
}

