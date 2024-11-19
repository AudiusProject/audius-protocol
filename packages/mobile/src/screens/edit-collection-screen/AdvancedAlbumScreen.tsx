import { advancedAlbumMessages as messages } from '@audius/common/messages'
import { useField } from 'formik'

import {
  Divider,
  Flex,
  IconCalendarMonth,
  IconIndent,
  Text
} from '@audius/harmony-native'
import { DateTimeInput } from 'app/components/core'
import { HarmonyTextField } from 'app/components/fields'
import { FormScreen } from 'app/screens/form-screen'

export const AdvancedAlbumScreen = () => {
  const [{ value: upc }, { touched }] = useField('upc')
  const [{ value: isHidden }] = useField('is_private')
  const [{ value: releaseDate, onChange }] = useField('release_date')

  const error = !upc || /^\d{12,13}$/.test(upc) ? null : messages.upcInputError

  return (
    <FormScreen
      title={messages.title}
      icon={IconIndent}
      bottomSection={null}
      variant='white'
      disableSubmit={!!error}
    >
      <Flex gap='xl' p='l' pt='xl'>
        <Flex gap='l'>
          <Text variant='title' size='l'>
            {messages.upcTitle}
          </Text>
          <HarmonyTextField
            name='upc'
            label={messages.upcInputLabel}
            transformValueOnChange={(value) => value.replace(/\D/g, '')}
            maxLength={13}
            error={touched && !!error}
            helperText={touched && error}
          />
        </Flex>
        {isHidden ? null : (
          <>
            <Divider />
            <Flex gap='l'>
              <Text variant='title' size='l'>
                {messages.releaseDate.title}
              </Text>
              <DateTimeInput
                date={releaseDate}
                mode='date'
                inputProps={{
                  startIcon: IconCalendarMonth,
                  label: messages.releaseDate.label
                }}
                onChange={onChange('release_date')}
                dateTimeProps={{ maximumDate: new Date() }}
              />
            </Flex>
          </>
        )}
      </Flex>
    </FormScreen>
  )
}
