import {
  pickHandlePageMessages as messages,
  useIsWaitingForValidation
} from '@audius/common'
import { useField } from 'formik'

import { Flex, IconCheck, Text } from '@audius/harmony-native'
import { TextField, type TextFieldProps } from 'app/components/fields'

export const HandleField = ({
  name = 'handle',
  ...other
}: Partial<TextFieldProps>) => {
  const [{ value: handle }, { error }] = useField(name)

  const { isWaitingForValidation, handleChange } = useIsWaitingForValidation()

  const helperText =
    error && error !== 'handle required' && handle
      ? error
      : handle && !isWaitingForValidation
      ? messages.handleAvailable
      : null

  return (
    <Flex gap='s'>
      {/* TODO: harmonize this component */}
      <TextField
        name={name}
        label={messages.handle}
        noGutter
        {...other}
        onChangeText={() => {
          handleChange()
        }}
        Icon={
          !isWaitingForValidation && handle && !error ? IconCheck : undefined
        }
      />
      {helperText ? (
        <Text color={error ? 'danger' : 'default'}>{helperText}</Text>
      ) : undefined}
    </Flex>
  )
}
