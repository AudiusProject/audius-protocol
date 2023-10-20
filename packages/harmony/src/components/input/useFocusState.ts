import { useState, useCallback, FocusEventHandler } from 'react'

/**
 * Used to track focus state of an element
 *
 * Why: Firefox doesn't support the :has() pseudo-selector, so we can't do .root:has(input:focus)
 * for focus styles. Instead, we have to manually track the focus state and add a class.
 *
 * To use:
 * - Pass in other handlers wanted for focus and blur as appropriate
 * - Assign handleFocus to the onFocus of the element
 * - Assign handleBlur to the onBlur of the element
 *
 * @param onFocus The existing onFocus handler, if any, to wrap
 * @param onBlur The existing onBlur handler, if any, to wrap
 * @returns [isFocused, handleFocus, handleBlur]
 */
export const useFocusState = <T extends HTMLElement>(
  onFocus?: FocusEventHandler<T>,
  onBlur?: FocusEventHandler<T>
) => {
  const [isFocused, setIsFocused] = useState(false)
  const handleFocus = useCallback<FocusEventHandler<T>>(
    (e) => {
      setIsFocused(true)
      onFocus?.(e)
    },
    [onFocus, setIsFocused]
  )
  const handleBlur = useCallback<FocusEventHandler<T>>(
    (e) => {
      setIsFocused(false)
      onBlur?.(e)
    },
    [onBlur, setIsFocused]
  )

  return [isFocused, handleFocus, handleBlur] as const
}
