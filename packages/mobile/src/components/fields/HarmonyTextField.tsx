import { useEffect } from 'react'

import { useDebouncedCallback } from '@audius/common'
import { useField, useFormikContext } from 'formik'

import { TextInput, type TextInputProps } from '@audius/harmony-native'

export type HarmonyTextFieldProps = TextInputProps & {
  name: string
  /**
   * Clears out field errors while the input is being changed for a small UX improvement
   * @default true
   */
  clearErrorOnChange?: boolean
  /** Function to transform the input value upon `onChange`.
   * E.g. a function to trim whitespace */
  transformValueOnChange?: (value: string) => string
  transformValueOnBlur?: (value: string) => string
  debouncedValidationMs?: number
}

export const HarmonyTextField = (props: HarmonyTextFieldProps) => {
  const {
    name,
    clearErrorOnChange = true,
    transformValueOnChange,
    transformValueOnBlur,
    debouncedValidationMs = 0,
    helperText,
    onChange: propsOnChange,
    error: errorProp,
    ...other
  } = props
  const [field, { touched, error: errorField }, { setError }] = useField(name)
  const { value } = field
  const { validateField, submitCount } = useFormikContext()
  const error = errorProp ?? errorField

  const debouncedValidateField = useDebouncedCallback(
    (field: string) => validateField(field),
    [validateField],
    debouncedValidationMs
  )

  useEffect(() => {
    if (debouncedValidationMs) {
      debouncedValidateField(name)
    }
  }, [debouncedValidationMs, debouncedValidateField, name, value])

  const hasError = Boolean(touched && error && submitCount > 0)

  return (
    <TextInput
      {...field}
      error={hasError}
      helperText={helperText ?? (hasError ? error : undefined)}
      onChange={(e) => {
        propsOnChange?.(e)
        if (clearErrorOnChange) {
          setError(undefined)
        }
        if (transformValueOnChange) {
          e.nativeEvent.text = transformValueOnChange(e.nativeEvent.text)
        }
        field.onChange(name)(e.nativeEvent.text)
      }}
      onBlur={(e) => {
        if (clearErrorOnChange) {
          setError(undefined)
        }
        if (transformValueOnBlur) {
          e.nativeEvent.text = transformValueOnBlur(e.nativeEvent.text)
        }
        field.onBlur(name)(e)
      }}
      {...other}
    />
  )
}
