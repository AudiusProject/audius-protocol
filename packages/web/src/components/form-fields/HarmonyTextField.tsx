import { TextInput, TextInputProps } from '@audius/harmony'
import { useField } from 'formik'

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
}

// TODO: rename to TextField and replace old usages
export const HarmonyTextField = (props: HarmonyTextFieldProps) => {
  const { name, clearErrorOnChange = true, transformValue, ...other } = props
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
        if (transformValue) {
          e.target.value = transformValue(e.target.value)
        }
        field.onChange(e)
      }}
      {...other}
    />
  )
}
