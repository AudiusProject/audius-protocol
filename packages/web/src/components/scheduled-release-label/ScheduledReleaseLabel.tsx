import { Text, IconCalendarMonth, Flex, useTheme } from '@audius/harmony'
import dayjs from 'dayjs'

import { getLocalTimezone } from 'utils/dateUtils'

export type ScheduledReleaseLabelProps = {
  released?: string | null
  isUnlisted?: boolean
  isScheduledRelease?: boolean
}

export const ScheduledReleaseLabel = ({
  released,
  isUnlisted,
  isScheduledRelease
}: ScheduledReleaseLabelProps) => {
  const { color } = useTheme()
  if (
    !released ||
    !isUnlisted ||
    !isScheduledRelease ||
    dayjs(released).isBefore(dayjs())
  ) {
    return null
  }
  return (
    <Flex alignItems='center' gap='xs'>
      <IconCalendarMonth size='s' fill={color.icon.accent} />
      <Text variant='body' size='xs' color='accent'>
        Releases{' '}
        {dayjs(released).format('M/D/YY [@] h A') + ' ' + getLocalTimezone()}
      </Text>
    </Flex>
  )
}
