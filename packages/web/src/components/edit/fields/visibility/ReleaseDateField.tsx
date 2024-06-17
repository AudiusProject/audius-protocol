import { Flex, Hint } from '@audius/harmony'
import { css } from '@emotion/css'
import dayjs from 'dayjs'
import { useFormikContext } from 'formik'

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

type ReleaseDateValues = {
  releaseDate: string
  releaseDateTime: string
  releaseDateMeridian: string
}

export const ReleaseDateField = () => {
  const { values } = useFormikContext<ReleaseDateValues>()
  const { releaseDate } = values

  const releaseDay = dayjs(releaseDate).startOf('day')
  const today = dayjs().startOf('day')
  const isScheduled = releaseDay.isAfter(today) && today.isBefore(releaseDay)

  return (
    <Flex direction='column' gap='l'>
      <Flex gap='l'>
        <Flex
          backgroundColor='surface1'
          border='default'
          borderRadius='s'
          ph='l'
          pv='m'
          css={(theme) => ({
            '&:hover': {
              borderColor: theme.color.border.strong
            }
          })}
        >
          <DatePickerField
            name='releaseDate'
            label={messages.dateLabel}
            futureDatesOnly
          />
        </Flex>
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
      {isScheduled ? (
        <Hint>{messages.futureReleaseHint(getLocalTimezone())}</Hint>
      ) : null}
    </Flex>
  )
}
