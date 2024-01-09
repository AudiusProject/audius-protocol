import type { TextFieldProps } from './TextField'
import { TextField } from './TextField'

export type PasswordFieldProps = TextFieldProps

export const PasswordField = (props: PasswordFieldProps) => {
  return (
    <TextField
      autoComplete='off'
      autoCorrect={false}
      autoCapitalize='none'
      textContentType='password'
      secureTextEntry
      {...props}
    />
  )
}
