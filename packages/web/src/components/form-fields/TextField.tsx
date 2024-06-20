import { TextInput, TextInputProps } from '@audius/harmony'
import { useField } from 'formik'

export type TextFieldProps = TextInputProps & {
  name: string
}

export const TextField = (props: TextFieldProps) => {
  const { name, ...other } = props
  const [field, { touched, error }] = useField(name)

  const hasError = Boolean(touched && error)

  return (
    <TextInput
      {...field}
      value={field.value ?? ''}
      error={hasError}
      helperText={hasError ? error : undefined}
      {...other}
    />
  )
}
