import { PasswordInput, PasswordInputProps } from '@audius/harmony'
import { HarmonyBaseTextField } from './HarmonyBaseTextField'

export type PasswordFieldProps = PasswordInputProps & {
  name: string
  /**
   * Clears out field errors while the input is being changed for a small UX improvement
   * @default true
   */
  clearErrorOnChange?: boolean
}

// TODO: rename to PasswordField and replace old usages
export const HarmonyPasswordField = (props: PasswordFieldProps) => {
  return (
    <HarmonyBaseTextField<PasswordInputProps>
      inputComponent={PasswordInput}
      {...props}
    />
  )
}
