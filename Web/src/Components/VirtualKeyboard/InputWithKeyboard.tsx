import React, { useRef, useCallback, forwardRef } from 'react'
import { useVirtualKeyboard } from '../../contexts/VirtualKeyboardContext'

interface InputWithKeyboardProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string
  onChange: (value: string) => void
  keyboardLayout?: 'default' | 'numeric'
  keyboardSize?: 'normal' | 'large' | 'ihm'
}

const InputWithKeyboard = forwardRef<HTMLInputElement, InputWithKeyboardProps>(({
  value,
  onChange,
  keyboardLayout = 'default',
  keyboardSize = 'large',
  onFocus,
  ...props
}, ref) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const { showKeyboard, setKeyboardLayout, setKeyboardSize } = useVirtualKeyboard()

  const scrollInputIntoView = useCallback(() => {
    window.setTimeout(() => {
      inputRef.current?.scrollIntoView({
        block: 'center',
        behavior: 'smooth',
      })
    }, 200)
  }, [])

  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    setKeyboardLayout(keyboardLayout)
    setKeyboardSize(keyboardSize)
    showKeyboard(inputRef, value, onChange)
    onFocus?.(e)
    scrollInputIntoView()
  }, [
    showKeyboard,
    value,
    onChange,
    keyboardLayout,
    setKeyboardLayout,
    keyboardSize,
    setKeyboardSize,
    onFocus,
    scrollInputIntoView,
  ])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }, [onChange])

  // Use a ref callback para sincronizar a ref externa
  const setRefs = (element: HTMLInputElement) => {
    inputRef.current = element
    if (typeof ref === 'function') {
      ref(element)
    } else if (ref) {
      ref.current = element
    }
  }

  return (
    <input
      ref={setRefs}
      value={value}
      onChange={handleChange}
      onFocus={handleFocus}
      {...props}
    />
  )
})

InputWithKeyboard.displayName = 'InputWithKeyboard'

export default InputWithKeyboard

