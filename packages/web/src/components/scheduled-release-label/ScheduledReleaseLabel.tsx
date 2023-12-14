import { Text, IconCalendarMonth } from '@audius/harmony'
import cn from 'classnames'
import moment from 'moment'

import premiumContentLabelStyles from '../track/PremiumContentLabel.module.css'

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
        premiumContentLabelStyles.labelContainer,
        styles.scheduledReleaseLabel
      )}
    >
      <IconCalendarMonth className={premiumContentLabelStyles.icon} />
      <Text>
        Releases {moment.utc(released).local().format('M/D/YY [@] h:mm A')}
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
        premiumContentLabelStyles.labelContainer,
        styles.scheduledReleaseLabel
      )}
    >
      <IconCalendarMonth />
      <Text color='accent' variant='title'>
        Releases {moment.utc(released).local().format('M/D/YY [@] h:mm A')}
      </Text>
    </div>
  )
}
