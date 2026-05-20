import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type KeyboardLayout = 'default' | 'numeric';
type KeyboardSize = 'normal' | 'large' | 'ihm';
type InputRef = React.RefObject<HTMLInputElement | null>;
type InputChangeHandler = (value: string) => void;

type VirtualKeyboardContextValue = {
  isKeyboardVisible: boolean;
  keyboardHeight: number;
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
  setKeyboardHeight: React.Dispatch<React.SetStateAction<number>>;
};

const VirtualKeyboardContext = createContext<VirtualKeyboardContextValue | undefined>(undefined);

export const VirtualKeyboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [activeInputRef, setActiveInputRef] = useState<InputRef | null>(null);
  const [onChangeCallback, setOnChangeCallback] = useState<InputChangeHandler | null>(null);
  const [keyboardLayout, setKeyboardLayout] = useState<KeyboardLayout>('default');
  const [keyboardSize, setKeyboardSize] = useState<KeyboardSize>('large');
  const [keyboardHeight, setKeyboardHeight] = useState(0);

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
    setKeyboardHeight(0);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (isKeyboardVisible && keyboardHeight > 0) {
      root.classList.add('virtual-keyboard-open');
      root.style.setProperty('--virtual-keyboard-height', `${keyboardHeight}px`);
    } else {
      root.classList.remove('virtual-keyboard-open');
      root.style.removeProperty('--virtual-keyboard-height');
    }
    return () => {
      root.classList.remove('virtual-keyboard-open');
      root.style.removeProperty('--virtual-keyboard-height');
    };
  }, [isKeyboardVisible, keyboardHeight]);

  const value = useMemo<VirtualKeyboardContextValue>(() => ({
    isKeyboardVisible,
    keyboardHeight,
    inputValue,
    activeInputRef,
    onChangeCallback,
    keyboardLayout,
    keyboardSize,
    showKeyboard,
    hideKeyboard,
    setInputValue,
    setKeyboardLayout,
    setKeyboardSize,
    setKeyboardHeight,
  }), [
    isKeyboardVisible,
    keyboardHeight,
    inputValue,
    activeInputRef,
    onChangeCallback,
    keyboardLayout,
    keyboardSize,
    showKeyboard,
    hideKeyboard,
    setKeyboardHeight,
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

/** Reduz a área rolável da página quando o teclado virtual está aberto. */
export function useKeyboardAwarePageStyle(
  extra?: React.CSSProperties
): React.CSSProperties {
  const { isKeyboardVisible, keyboardHeight } = useVirtualKeyboard();

  const base: React.CSSProperties = {
    minHeight: '100dvh',
    height: '100dvh',
    boxSizing: 'border-box',
    ...extra,
  };

  if (!isKeyboardVisible || keyboardHeight <= 0) {
    return base;
  }

  const available = `calc(100dvh - ${keyboardHeight}px)`;
  return {
    ...base,
    height: available,
    minHeight: available,
    maxHeight: available,
  };
}

