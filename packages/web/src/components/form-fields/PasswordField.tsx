import { PasswordInput, PasswordInputProps } from '@audius/harmony'
import { useField } from 'formik'

export type PasswordFieldProps = PasswordInputProps & {
  name: string
}

export const PasswordField = (props: PasswordFieldProps) => {
  const { name, ...other } = props
  const [field, { touched, error }] = useField(name)

  const hasError = Boolean(touched && error)

  return <PasswordInput {...field} error={hasError} {...other} />
}
