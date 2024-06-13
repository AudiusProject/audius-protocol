import { Text, IconCalendarMonth } from '@audius/harmony'
import cn from 'classnames'
import dayjs from 'dayjs'

import { getLocalTimezone } from 'utils/dateUtils'

import gatedContentLabelStyles from '../track/GatedContentLabel.module.css'

import styles from './ScheduledReleaseLabel.module.css'

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
  if (
    !released ||
    !isUnlisted ||
    !isScheduledRelease ||
    dayjs(released).isBefore(dayjs())
  ) {
    return null
  }
  return (
    <div
      className={cn(
        gatedContentLabelStyles.labelContainer,
        styles.scheduledReleaseLabel
      )}
    >
      <IconCalendarMonth size='s' />
      <Text variant='body' size='xs'>
        Releases{' '}
        {dayjs(released).format('M/D/YY [@] h A') + ' ' + getLocalTimezone()}
      </Text>
    </div>
  )
}
