import { useEffect, useLayoutEffect, useRef, useCallback } from 'react'
import Keyboard from 'react-simple-keyboard'
import 'react-simple-keyboard/build/css/index.css'
import { useVirtualKeyboard } from '../../contexts/VirtualKeyboardContext'

const VirtualKeyboard = () => {
  const {
    isKeyboardVisible,
    inputValue,
    activeInputRef,
    hideKeyboard,
    setInputValue,
    onChangeCallback,
    keyboardLayout,
    keyboardSize,
    setKeyboardHeight,
  } = useVirtualKeyboard()

  const keyboardRef = useRef<any>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Sincroniza ao abrir o teclado ou ao trocar de campo (ex.: usuário → senha)
  useEffect(() => {
    if (isKeyboardVisible && keyboardRef.current) {
      keyboardRef.current.setInput(inputValue)
    }
    // inputValue omitido de propósito: só resetar ao mudar activeInputRef, não a cada tecla
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isKeyboardVisible, activeInputRef])

  const handleChange = useCallback((input: string) => {
    setInputValue(input)
    if (onChangeCallback) {
      onChangeCallback(input)
    }
  }, [setInputValue, onChangeCallback])

  const handleKeyPress = useCallback((button: string) => {
    if (button === '{enter}') {
      hideKeyboard()
    }
    if (button === '{bksp}') {
      const newValue = inputValue.slice(0, -1)
      setInputValue(newValue)
      if (onChangeCallback) {
        onChangeCallback(newValue)
      }
      if (keyboardRef.current) {
        keyboardRef.current.setInput(newValue)
      }
    }
  }, [hideKeyboard, inputValue, setInputValue, onChangeCallback])

  useLayoutEffect(() => {
    if (!isKeyboardVisible) {
      setKeyboardHeight(0)
      return
    }

    const wrapper = wrapperRef.current
    if (!wrapper) return

    const measure = () => {
      const height = Math.ceil(wrapper.getBoundingClientRect().height)
      if (height > 0) setKeyboardHeight(height)
    }

    measure()
    const raf = requestAnimationFrame(measure)
    const t1 = window.setTimeout(measure, 80)
    const t2 = window.setTimeout(measure, 250)

    const observer = new ResizeObserver(measure)
    observer.observe(wrapper)

    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      observer.disconnect()
    }
  }, [isKeyboardVisible, keyboardLayout, keyboardSize, setKeyboardHeight])

  if (!isKeyboardVisible) {
    return null
  }

  const sizeClass =
    keyboardSize === 'ihm'
      ? 'virtual-keyboard-ihm'
      : keyboardSize === 'large'
        ? 'virtual-keyboard-large'
        : ''

  // Layout padrão QWERTY brasileiro
  const defaultLayout = {
    default: [
      '1 2 3 4 5 6 7 8 9 0 {bksp}',
      'q w e r t y u i o p',
      'a s d f g h j k l ç',
      '{shift} z x c v b n m , .',
      '{space} {enter}'
    ],
    shift: [
      '! @ # $ % ¨ & * ( ) {bksp}',
      'Q W E R T Y U I O P',
      'A S D F G H J K L Ç',
      '{shift} Z X C V B N M < >',
      '{space} {enter}'
    ]
  }

  // Layout numérico
  const numericLayout = {
    default: [
      '1 2 3',
      '4 5 6',
      '7 8 9',
      '{bksp} 0 {enter}'
    ]
  }

  const display = {
    '{bksp}': '⌫',
    '{enter}': '✓',
    '{shift}': '⇧',
    '{space}': 'Espaço'
  }

  return (
    <div className="virtual-keyboard-container">
      {/* Container do teclado */}
      <div ref={wrapperRef} className={`virtual-keyboard-wrapper ${sizeClass}`}>
        <div className="virtual-keyboard-header">
          <span className="text-sm text-gray-600">Teclado Virtual</span>
          <button
            onClick={hideKeyboard}
            className="virtual-keyboard-close"
            aria-label="Fechar teclado"
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
        
        <Keyboard
          keyboardRef={(r) => (keyboardRef.current = r)}
          layout={keyboardLayout === 'numeric' ? numericLayout : defaultLayout}
          display={display}
          onChange={handleChange}
          onKeyPress={handleKeyPress}
          theme="hg-theme-default virtual-keyboard-theme"
          physicalKeyboardHighlight={true}
          physicalKeyboardHighlightPress={true}
        />
      </div>
    </div>
  )
}

export default VirtualKeyboard

