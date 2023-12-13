import { useEffect } from 'react'

import { useDebouncedCallback } from '@audius/common'
import { TextInput, TextInputProps } from '@audius/harmony'
import { useField, useFormikContext } from 'formik'

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

// TODO: rename to TextField and replace old usages
export const HarmonyTextField = (props: HarmonyTextFieldProps) => {
  const {
    name,
    clearErrorOnChange = true,
    transformValueOnChange,
    transformValueOnBlur,
    debouncedValidationMs,
    ...other
  } = props
  const [field, { touched, error }, { setError }] = useField(name)
  const { value } = field
  const { validateField } = useFormikContext()

  const debouncedValidateField = useDebouncedCallback(
    (field: string) => validateField(field),
    [validateField],
    500
  )

  useEffect(() => {
    if (debouncedValidationMs) {
      debouncedValidateField(name)
    }
  }, [debouncedValidationMs, debouncedValidateField, name, value])

  const hasError = Boolean(touched && error)

  return (
    <TextInput
      {...field}
      error={hasError}
      helperText={hasError ? error : undefined}
      onChange={(e) => {
        if (clearErrorOnChange) {
          setError(undefined)
        }
        if (transformValueOnChange) {
          e.target.value = transformValueOnChange(e.target.value)
        }
        field.onChange(e)
      }}
      onBlur={(e) => {
        if (clearErrorOnChange) {
          setError(undefined)
        }
        if (transformValueOnBlur) {
          e.target.value = transformValueOnBlur(e.target.value)
        }
        field.onChange(e)
        field.onBlur(e)
      }}
      {...other}
    />
  )
}
