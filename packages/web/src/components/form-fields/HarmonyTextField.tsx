import { TextInput } from '@audius/harmony'
import { TextInputProps } from '@audius/harmony/dist/components/input/TextInput/types'
import { useField } from 'formik'

export type TextFieldProps = TextInputProps & {
  name: string
  /**
   * Clears out field errors while the input is being changed for a small UX improvement
   * @default true
   */
  clearErrorOnChange?: boolean
}

// TODO: rename to TextField and replace old usages
export const HarmonyTextField = (props: TextFieldProps) => {
  const { name, clearErrorOnChange = true, ...other } = props
  const [field, { touched, error }, { setError }] = useField(name)

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
        field.onChange(e)
      }}
      {...other}
    />
  )
}
