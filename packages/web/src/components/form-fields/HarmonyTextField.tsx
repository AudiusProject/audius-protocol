import { TextInput } from '@audius/harmony'
import { TextInputProps } from '@audius/harmony/dist/components/input/TextInput/types'
import { useField } from 'formik'

export type TextFieldProps = TextInputProps & {
  name: string
}

// TODO: rename to TextField and replace old usages
export const HarmonyTextField = (props: TextFieldProps) => {
  const { name, ...other } = props
  const [field, { touched, error }] = useField(name)

  const hasError = Boolean(touched && error)

  return (
    <TextInput
      {...field}
      error={hasError}
      helperText={hasError ? error : undefined}
      {...other}
    />
  )
}
