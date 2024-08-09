import { ChangeEvent, useRef } from 'react'

export type UseRegexMaskedInputParams = {
  regex: RegExp
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void
}

/**
 * Mask input values based on a regex pattern.
 *
 * @example
 * const maskedInputProps = useRegexMaskedInput({ regex: /^\d{0,4}$/ })
 * return <input {...maskedInputProps} />
 */
export const useRegexMaskedInput = (params: UseRegexMaskedInputParams) => {
  const { regex, onChange } = params
  const ref = useRef<HTMLInputElement>(null)
  const previousValidValue = useRef('')

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target
    const value = input.value

    if (regex.test(value)) {
      // If the value matches the regex, update the previous valid value
      previousValidValue.current = value
      onChange?.(event)
    } else {
      // If the value doesn't match the regex, revert to the previous valid value
      input.value = previousValidValue.current
    }
  }
  return {
    ref,
    onChange: handleChange
  }
}
