import { TextField, type TextFieldProps } from 'app/components/fields'

export type EmailFieldProps = TextFieldProps

export const EmailField = (props: EmailFieldProps) => {
  return (
    <TextField
      keyboardType='email-address'
      autoComplete='off'
      autoCorrect={false}
      autoCapitalize='none'
      {...props}
    />
  )
}
