import { useField } from 'formik'

import { IconCalendarMonth, Text, Flex } from '@audius/harmony-native'
import { DateTimeInput } from 'app/components/core'
import { FormScreen } from 'app/screens/form-screen'

export enum ReleaseDateType {
  RELEASE_NOW = 'RELEASE_NOW',
  SCHEDULED_RELEASE = 'SCHEDULED_RELEASE'
}

const messages = {
  title: 'Release Date',
  description: 'Specify the release date of your music.',
  dateInputLabel: 'Release Date',
  pastReleaseHint:
    'Setting a release date in the past will impact the order tracks appear on your profile.'
}

export const ReleaseDateScreen = (props) => {
  const [{ value: releaseDate, onChange }] = useField('release_date')

  return (
    <FormScreen title={messages.title} icon={IconCalendarMonth} variant='white'>
      <Flex p='xl' gap='xl'>
        <Text>{messages.description}</Text>
        <DateTimeInput
          mode='date'
          date={releaseDate}
          onChange={onChange('release_date')}
          inputProps={{
            startIcon: IconCalendarMonth,
            label: messages.dateInputLabel
          }}
          dateTimeProps={{ maximumDate: new Date() }}
        />
      </Flex>
    </FormScreen>
  )
}
