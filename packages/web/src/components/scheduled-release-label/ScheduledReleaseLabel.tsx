import { Text } from '@audius/harmony'
import { IconCalendar } from '@audius/stems'
import cn from 'classnames'
import moment from 'moment'

import premiumContentLabelStyles from '../track/PremiumContentLabel.module.css'

import styles from './ScheduledReleaseLabel.module.css'

export type ScheduledReleaseLabelProps = {
  released?: string | null
  isUnlisted?: boolean
}

export const ScheduledReleaseLabel = ({
  released, isUnlisted
}: ScheduledReleaseLabelProps) => {
  if (!released || !isUnlisted) {
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
      Releases {moment.utc(released).local().format('M/D/YY [@] h:mm A')} 
    </div>
  )
}

export const ScheduledReleaseGiantLabel = ({
  released, isUnlisted
}: ScheduledReleaseLabelProps) => {
  if (!released || !isUnlisted) {
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
        Releases {moment.utc(released).local().format('M/D/YY [@] h:mm A')} 
      </Text>
    </div>
  )
}
