import { visibilityMessages as messages } from '@audius/common/messages'
import { getLocalTimezone, type Nullable } from '@audius/common/utils'
import dayjs from 'dayjs'
import calendar from 'dayjs/plugin/calendar'

import { Flex, Hint, IconCalendarMonth } from '@audius/harmony-native'
import { DateTimeInput } from 'app/components/core'

dayjs.extend(calendar)

type ScheduledReleaseDateFieldProps = {
  releaseDate: Nullable<string>
  onChange: (date: string) => void
  dateError?: string
  dateTimeError?: string
}

export const ScheduledReleaseDateField = (
  props: ScheduledReleaseDateFieldProps
) => {
  const { releaseDate, onChange, dateError, dateTimeError } = props
  return (
    <Flex direction='column' gap='l'>
      <Flex gap='l'>
        <Flex gap='l'>
          <DateTimeInput
            mode='date'
            date={releaseDate ?? undefined}
            onChange={(date) => {
              if (dayjs().isSame(dayjs(date), 'day')) {
                onChange(
                  dayjs(date).set('hour', 23).set('minutes', 59).toString()
                )
              } else {
                onChange(date)
              }
            }}
            formatDate={(date) =>
              dayjs(date).calendar(null, {
                sameDay: '[Today]',
                nextDay: '[Tomorrow]',
                nextWeek: 'dddd',
                lastDay: '[Yesterday]',
                lastWeek: '[Last] dddd',
                sameElse: 'M/D/YY' // This is where you format dates that don't fit in the above categories
              })
            }
            inputProps={{
              label: messages.dateLabel,
              startIcon: IconCalendarMonth,
              error: !!dateError,
              helperText: dateError
            }}
            dateTimeProps={{
              minimumDate: dayjs().toDate()
            }}
          />
          <DateTimeInput
            mode='time'
            date={releaseDate ?? undefined}
            onChange={onChange}
            inputProps={{
              label: messages.timeLabel,
              error: !!dateTimeError,
              helperText: dateTimeError
            }}
          />
        </Flex>
      </Flex>
      {releaseDate ? (
        <Hint>{messages.futureReleaseHint(getLocalTimezone())}</Hint>
      ) : null}
    </Flex>
  )
}
