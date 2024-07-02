import { Flex, Hint } from '@audius/harmony'
import { css } from '@emotion/css'
import { useField } from 'formik'

import { DropdownField } from 'components/form-fields'
import { HarmonyTextField } from 'components/form-fields/HarmonyTextField'
import { getLocalTimezone } from 'utils/dateUtils'

import { DatePickerField } from '../DatePickerField'

const messages = {
  dateLabel: 'Release Date',
  timeLabel: 'Time',
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
        <DropdownField
          placeholder={messages.meridianPlaceholder}
          menu={{ items: ['AM', 'PM'] }}
          size='large'
          name='releaseDateMeridian'
          dropdownInputStyle={css({
            height: '64px !important',
            '.ant-select-selection-item': {
              display: 'flex',
              alignItems: 'center'
            }
          })}
        />
      </Flex>
      {releaseDate && touched ? (
        <Hint>{messages.futureReleaseHint(getLocalTimezone())}</Hint>
      ) : null}
    </Flex>
  )
}
