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
  transformValue?: (value: string) => string
  transformBlurValue?: (value: string) => string
  debouncedValidationMs?: number
}

// TODO: rename to TextField and replace old usages
export const HarmonyTextField = (props: HarmonyTextFieldProps) => {
  const {
    name,
    clearErrorOnChange = true,
    transformValue,
    transformBlurValue,
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
        if (transformValue) {
          e.target.value = transformValue(e.target.value)
        }
        field.onChange(e)
      }}
      onBlur={(e) => {
        console.log('asdf onBlur')

        if (clearErrorOnChange) {
          setError(undefined)
        }
        if (transformBlurValue) {
          e.target.value = transformBlurValue(e.target.value)
          console.log('asdf onBlur: ', transformBlurValue, e.target.value)
        }
        field.onChange(e)
        field.onBlur(e)
      }}
      {...other}
    />
  )
}
