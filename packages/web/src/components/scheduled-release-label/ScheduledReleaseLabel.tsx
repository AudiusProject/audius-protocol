import { Text } from '@audius/harmony'
import { IconCalendar } from '@audius/stems'
import cn from 'classnames'
import moment from 'moment'

import premiumContentLabelStyles from '../track/PremiumContentLabel.module.css'

import styles from './ScheduledReleaseLabel.module.css'

export type ScheduledReleaseLabelProps = {
  released?: string | null
}

export const ScheduledReleaseLabel = ({
  released
}: ScheduledReleaseLabelProps) => {
  if (!released || moment.utc(released).isBefore(moment())) {
    return <></>
  }
  return (
    <div
      className={cn(
        premiumContentLabelStyles.labelContainer,
        styles.scheduledReleaseLabel
      )}
    >
      <IconCalendar className={premiumContentLabelStyles.icon} />
      Releases on {moment(released).calendar()}
    </div>
  )
}

export const ScheduledReleaseGiantLabel = ({
  released
}: ScheduledReleaseLabelProps) => {
  if (!released || moment.utc(released).isBefore(moment())) {
    return <></>
  }

  return (
    <div
      className={cn(
        premiumContentLabelStyles.labelContainer,
        styles.scheduledReleaseLabel
      )}
    >
      <IconCalendar />
      <Text color='accent' variant='title'>
        Releases on {released}
      </Text>
    </div>
  )
}
