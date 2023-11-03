import { TextInput } from '@audius/harmony'
import { TextInputProps } from '@audius/harmony/dist/components/input/TextInput/types'
import { HarmonyBaseTextField } from './HarmonyBaseTextField'

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
  return (
    <HarmonyBaseTextField<TextInputProps>
      inputComponent={TextInput}
      {...props}
    />
  )
}
