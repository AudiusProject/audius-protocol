import { useField } from 'formik'

import type { PasswordInputProps } from '@audius/harmony-native'
import { PasswordInput } from '@audius/harmony-native'

export type PasswordFieldProps = PasswordInputProps & { name: string }

export const PasswordField = (props: PasswordFieldProps) => {
  const { name, ...other } = props
  const [{ value, onChange }] = useField(name)
  return (
    <PasswordInput value={value} onChangeText={onChange(name)} {...other} />
  )
}
