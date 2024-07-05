import { Box, Flex, Hint } from '@audius/harmony'
import { useField } from 'formik'

import { HarmonyTextField } from 'components/form-fields/HarmonyTextField'
import { SelectField } from 'components/form-fields/SelectField'
import { getLocalTimezone } from 'utils/dateUtils'

import { DatePickerField } from '../DatePickerField'

const messages = {
  dateLabel: 'Release Date',
  timeLabel: 'Time',
  meridianLabel: 'Meridian',
  meridianPlaceholder: 'AM',
  pastReleaseHint:
    'Setting a release date in the past will impact the order tracks appear on your profile.',
  futureReleaseHint: (timezone: string) =>
    `This will be released at the selected date/time in your local timezone (${timezone}).`
}

export const ReleaseDateField = () => {
  const [{ value: releaseDate }, { touched }] = useField('releaseDate')

  return (
    <Flex direction='column' gap='l'>
      <Flex gap='l'>
        <DatePickerField
          name='releaseDate'
          label={messages.dateLabel}
          futureDatesOnly
        />
        <Flex gap='l'>
          <Box flex={1}>
            <HarmonyTextField
              name='releaseDateTime'
              label={messages.timeLabel}
              transformValueOnBlur={(value) => {
                if (value.includes(':')) {
                  return value
                }
                // add :00 if it's missing
                const number = parseInt(value, 10)
                if (!isNaN(number) && number >= 1 && number <= 12) {
                  return `${number}:00`
                }
                return value
              }}
            />
          </Box>
          <Box flex={1}>
            <SelectField
              label={messages.meridianLabel}
              placeholder={messages.meridianPlaceholder}
              hideLabel
              name='releaseDateMeridian'
              options={[
                { value: 'AM', label: 'AM' },
                { value: 'PM', label: 'PM' }
              ]}
            />
          </Box>
        </Flex>
      </Flex>
      {releaseDate && touched ? (
        <Hint>{messages.futureReleaseHint(getLocalTimezone())}</Hint>
      ) : null}
    </Flex>
  )
}
