import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

type KeyboardLayout = 'default' | 'numeric';
type KeyboardSize = 'normal' | 'large';
type InputRef = React.RefObject<HTMLInputElement | null>;
type InputChangeHandler = (value: string) => void;

type VirtualKeyboardContextValue = {
  isKeyboardVisible: boolean;
  inputValue: string;
  activeInputRef: InputRef | null;
  onChangeCallback: InputChangeHandler | null;
  keyboardLayout: KeyboardLayout;
  keyboardSize: KeyboardSize;
  showKeyboard: (inputRef: InputRef, value: string, onChange: InputChangeHandler) => void;
  hideKeyboard: () => void;
  setInputValue: React.Dispatch<React.SetStateAction<string>>;
  setKeyboardLayout: React.Dispatch<React.SetStateAction<KeyboardLayout>>;
  setKeyboardSize: React.Dispatch<React.SetStateAction<KeyboardSize>>;
};

const VirtualKeyboardContext = createContext<VirtualKeyboardContextValue | undefined>(undefined);

export const VirtualKeyboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [activeInputRef, setActiveInputRef] = useState<InputRef | null>(null);
  const [onChangeCallback, setOnChangeCallback] = useState<InputChangeHandler | null>(null);
  const [keyboardLayout, setKeyboardLayout] = useState<KeyboardLayout>('default');
  const [keyboardSize, setKeyboardSize] = useState<KeyboardSize>('normal');

  const showKeyboard = useCallback((inputRef: InputRef, value: string, onChange: InputChangeHandler) => {
    setActiveInputRef(inputRef);
    setInputValue(value);
    setOnChangeCallback(() => onChange);
    setIsKeyboardVisible(true);
  }, []);

  const hideKeyboard = useCallback(() => {
    setIsKeyboardVisible(false);
    setActiveInputRef(null);
    setOnChangeCallback(null);
  }, []);

  const value = useMemo<VirtualKeyboardContextValue>(() => ({
    isKeyboardVisible,
    inputValue,
    activeInputRef,
    onChangeCallback,
    keyboardLayout,
    keyboardSize,
    showKeyboard,
    hideKeyboard,
    setInputValue,
    setKeyboardLayout,
    setKeyboardSize
  }), [
    isKeyboardVisible,
    inputValue,
    activeInputRef,
    onChangeCallback,
    keyboardLayout,
    keyboardSize,
    showKeyboard,
    hideKeyboard
  ]);

  return <VirtualKeyboardContext.Provider value={value}>{children}</VirtualKeyboardContext.Provider>;
};

export function useVirtualKeyboard(): VirtualKeyboardContextValue {
  const ctx = useContext(VirtualKeyboardContext);
  if (!ctx) {
    throw new Error('useVirtualKeyboard must be used within a VirtualKeyboardProvider');
  }
  return ctx;
}

