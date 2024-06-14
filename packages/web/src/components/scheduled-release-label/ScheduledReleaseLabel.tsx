import { formatReleaseDate } from '@audius/common/utils'
import { Text, IconCalendarMonth, Flex, useTheme } from '@audius/harmony'
import dayjs from 'dayjs'

import { getLocalTimezone } from 'utils/dateUtils'

const messages = {
  releases: (date: string) =>
    `Releases ${formatReleaseDate({
      date,
      withHour: true
    })} ${getLocalTimezone()}`
}

export type ScheduledReleaseLabelProps = {
  releaseDate?: string | null
  isUnlisted?: boolean
  isScheduledRelease?: boolean
}

export const ScheduledReleaseLabel = ({
  releaseDate,
  isUnlisted,
  isScheduledRelease
}: ScheduledReleaseLabelProps) => {
  const { color } = useTheme()
  if (
    !releaseDate ||
    !isUnlisted ||
    !isScheduledRelease ||
    dayjs(releaseDate).isBefore(dayjs())
  )
    return null

  return (
    <Flex alignItems='center' gap='xs' w='100%'>
      <IconCalendarMonth size='s' fill={color.icon.accent} />
      <Text variant='body' size='xs' color='accent'>
        {messages.releases(releaseDate)}
      </Text>
    </Flex>
  )
}
