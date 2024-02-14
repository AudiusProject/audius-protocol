import { useField } from 'formik'

import type { PasswordInputProps } from '@audius/harmony-native'
import { PasswordInput } from '@audius/harmony-native'

export type PasswordFieldProps = PasswordInputProps & {
  name: string
  /**
   * Clears out field errors while the input is being changed for a small UX improvement
   * @default true
   */
  clearErrorOnChange?: boolean
}

export const PasswordField = (props: PasswordFieldProps) => {
  const { name, clearErrorOnChange = true, ...other } = props
  const [field, { touched, error }, { setError }] = useField(name)

  const hasError = Boolean(touched && error)

  return (
    <PasswordInput
      {...field}
      error={hasError}
      helperText={hasError ? error : undefined}
      onChangeText={(e) => {
        if (clearErrorOnChange) {
          setError(undefined)
        }
        field.onChange(name)(e)
      }}
      onBlur={field.onBlur(name)}
      {...other}
    />
  )
}
