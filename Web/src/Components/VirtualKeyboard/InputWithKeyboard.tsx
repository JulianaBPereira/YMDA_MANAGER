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
  onPointerDown,
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

  const openKeyboard = useCallback(() => {
    setKeyboardLayout(keyboardLayout)
    setKeyboardSize(keyboardSize)
    showKeyboard(inputRef, value, onChange)
    scrollInputIntoView()
    inputRef.current?.blur()
  }, [
    showKeyboard,
    value,
    onChange,
    keyboardLayout,
    setKeyboardLayout,
    keyboardSize,
    setKeyboardSize,
    scrollInputIntoView,
  ])

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLInputElement>) => {
    e.preventDefault()
    openKeyboard()
    onPointerDown?.(e)
  }, [openKeyboard, onPointerDown])

  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    e.target.blur()
    openKeyboard()
    onFocus?.(e)
  }, [openKeyboard, onFocus])

  const setRefs = (element: HTMLInputElement | null) => {
    inputRef.current = element
    if (typeof ref === 'function') {
      ref(element)
    } else if (ref) {
      ref.current = element
    }
  }

  const isPassword = props.type === 'password'
  const { className, type, ...restProps } = props

  return (
    <input
      ref={setRefs}
      value={value}
      onPointerDown={handlePointerDown}
      onFocus={handleFocus}
      {...restProps}
      type={isPassword ? 'text' : type}
      className={isPassword ? [className, 'vk-password-mask'].filter(Boolean).join(' ') : className}
      readOnly
      autoComplete="off"
      inputMode="none"
      spellCheck={false}
      onChange={undefined}
    />
  )
})

InputWithKeyboard.displayName = 'InputWithKeyboard'

export default InputWithKeyboard
