import { advancedAlbumMessages as messages } from '@audius/common/messages'
import { useField } from 'formik'

import { Flex, IconIndent, Text } from '@audius/harmony-native'
import { HarmonyTextField } from 'app/components/fields'
import { FormScreen } from 'app/screens/form-screen'

export const AdvancedAlbumScreen = () => {
  const [{ value: upc }, { touched }] = useField('upc')

  const error = !upc || /^\d{12}$/.test(upc) ? null : messages.upcInputError

  return (
    <FormScreen
      title={messages.title}
      icon={IconIndent}
      bottomSection={null}
      variant='white'
      disableSubmit={!!error}
    >
      <Flex gap='l' p='l' pt='xl'>
        <Text variant='title' size='l'>
          {messages.upcTitle}
        </Text>
        <HarmonyTextField
          name='upc'
          label={messages.upcInputLabel}
          transformValueOnChange={(value) => value.replace(/\D/g, '')}
          maxLength={12}
          error={touched && !!error}
          helperText={touched && error}
        />
      </Flex>
    </FormScreen>
  )
}
