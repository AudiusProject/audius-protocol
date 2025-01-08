import { PasswordInput, PasswordInputProps } from '@audius/harmony'
import { useField } from 'formik'

type PasswordFieldProps = PasswordInputProps & {
  name: string
  /**
   * Clears out field errors while the input is being changed for a small UX improvement
   * @default true
   */
  clearErrorOnChange?: boolean
}

// TODO: rename to PasswordField and replace old usages
export const HarmonyPasswordField = (props: PasswordFieldProps) => {
  const { name, clearErrorOnChange = true, ...other } = props
  const [field, { touched, error }, { setError }] = useField(name)

  const hasError = Boolean(touched && error)

  return (
    <PasswordInput
      {...field}
      error={hasError}
      helperText={hasError ? error : undefined}
      onChange={(e) => {
        if (clearErrorOnChange) {
          setError(undefined)
        }
        field.onChange(e)
      }}
      {...other}
    />
  )
}
