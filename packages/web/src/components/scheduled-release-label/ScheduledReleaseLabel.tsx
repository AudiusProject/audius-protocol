import { getLocalTimezone } from '@audius/common'
import { Text, IconCalendarMonth } from '@audius/harmony'
import cn from 'classnames'
import moment from 'moment'

import gatedContentLabelStyles from '../track/GatedContentLabel.module.css'

import styles from './ScheduledReleaseLabel.module.css'

export type ScheduledReleaseLabelProps = {
  released?: string | null
  isUnlisted?: boolean
}

export const ScheduledReleaseLabel = ({
  released,
  isUnlisted
}: ScheduledReleaseLabelProps) => {
  if (!released || !isUnlisted) {
    return null
  }
  return (
    <div
      className={cn(
        gatedContentLabelStyles.labelContainer,
        styles.scheduledReleaseLabel
      )}
    >
      <IconCalendarMonth />
      <Text>
        Releases{' '}
        {moment.utc(released).local().format('M/D/YY [@] h:mm A') +
          ' ' +
          getLocalTimezone()}
      </Text>
    </div>
  )
}

export const ScheduledReleaseGiantLabel = ({
  released,
  isUnlisted
}: ScheduledReleaseLabelProps) => {
  if (!released || !isUnlisted) {
    return null
  }

  return (
    <div
      className={cn(
        gatedContentLabelStyles.labelContainer,
        styles.scheduledReleaseLabel
      )}
    >
      <IconCalendarMonth />
      <Text color='accent' variant='title'>
        Releases on{' '}
        {moment.utc(released).local().format('M/D/YY [@] h:mm A') +
          ' ' +
          getLocalTimezone()}
      </Text>
    </div>
  )
}
