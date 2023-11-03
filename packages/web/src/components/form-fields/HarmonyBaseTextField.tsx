import { TextInput } from '@audius/harmony'
import type { TextInputProps, PasswordInputProps } from '@audius/harmony'
import { useField } from 'formik'
import { ComponentType } from 'react'

export type BaseHarmonyTextFieldProps<
  T extends TextInputProps | PasswordInputProps
> = T & {
  name: string
  /**
   * Clears out field errors while the input is being changed for a small UX improvement
   * @default true
   */
  clearErrorOnChange?: boolean
  inputComponent?: ComponentType<T>
}

/** Building block for Harmony Text Field components. Not intended for general use. */
export function HarmonyBaseTextField<
  T extends TextInputProps | PasswordInputProps
>(props: BaseHarmonyTextFieldProps<T>) {
  const { name, clearErrorOnChange = true, inputComponent, ...other } = props
  const [field, { touched, error }, { setError }] = useField(name)
  const InputComponent = inputComponent ? inputComponent : TextInput

  const hasError = Boolean(touched && error)

  return (
    // @ts-expect-error
    <InputComponent
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
