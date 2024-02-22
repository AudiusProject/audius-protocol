import { useIsWaitingForValidation } from '@audius/common/hooks'
import { pickHandlePageMessages } from '@audius/common/messages'
import { MAX_HANDLE_LENGTH } from '@audius/common/services'
import { useField, useFormikContext } from 'formik'

import { IconCheck } from '@audius/harmony-native'
import type { HarmonyTextFieldProps } from 'app/components/fields'
import { HarmonyTextField } from 'app/components/fields'

export const HandleField = (props: Partial<HarmonyTextFieldProps>) => {
  const { name = 'handle', ...other } = props
  const [{ value: handle }, { error }] = useField(name)

  const { isValid } = useFormikContext()

  const { isWaitingForValidation, handleChange } = useIsWaitingForValidation()

  const getHelperText = () => {
    if (isWaitingForValidation) return undefined
    if (error && handle) return error
    if (handle && isValid) return pickHandlePageMessages.handleAvailable
    return undefined
  }

  return (
    <HarmonyTextField
      name={name}
      label={pickHandlePageMessages.handle}
      helperText={getHelperText()}
      maxLength={MAX_HANDLE_LENGTH}
      startAdornmentText='@'
      placeholder={pickHandlePageMessages.handle}
      transformValueOnChange={(value) => value.replace(/\s/g, '')}
      debouncedValidationMs={1000}
      endIcon={
        handle && isValid && !isWaitingForValidation ? IconCheck : undefined
      }
      IconProps={{ size: 'l', color: 'default' }}
      autoCapitalize='none'
      autoComplete='off'
      onChange={() => {
        handleChange()
      }}
      {...other}
      error={!!error}
    />
  )
}
