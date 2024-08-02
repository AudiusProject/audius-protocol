import { formatReleaseDate } from '@audius/common/utils'
import { IconCalendarMonth, IconVisibilityHidden } from '@audius/harmony'

import { getLocalTimezone } from 'utils/dateUtils'

import { LineupTileLabel } from './LineupTileLabel'

const messages = {
  hidden: 'Hidden',
  releases: (date: string) =>
    `Releases ${formatReleaseDate({
      date,
      withHour: true
    })} ${getLocalTimezone()}`
}

export type VisibilityLabelProps = {
  releaseDate?: string | null
  isUnlisted?: boolean
  isScheduledRelease?: boolean
}

export const VisibilityLabel = (props: VisibilityLabelProps) => {
  const { releaseDate, isUnlisted, isScheduledRelease } = props

  if (releaseDate && isUnlisted && isScheduledRelease) {
    return (
      <LineupTileLabel icon={IconCalendarMonth} color='accent'>
        {messages.releases(releaseDate)}
      </LineupTileLabel>
    )
  }

  if (isUnlisted) {
    return (
      <LineupTileLabel icon={IconVisibilityHidden} color='subdued'>
        {messages.hidden}
      </LineupTileLabel>
    )
  }

  return null
}
