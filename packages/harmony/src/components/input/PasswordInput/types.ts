import type { TextInputProps } from '../TextInput/types'

export type PasswordInputProps = Omit<TextInputProps, 'type'> & {
  hideVisibilityToggle?: boolean
}
