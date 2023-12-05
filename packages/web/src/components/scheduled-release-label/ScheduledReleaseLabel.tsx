import { Text } from '@audius/harmony'
import { IconCalendar } from '@audius/stems'
import cn from 'classnames'
import moment from 'moment'

import { getScheduledReleaseLabelMessage } from 'utils/dateUtils'

import premiumContentLabelStyles from '../track/PremiumContentLabel.module.css'

import styles from './ScheduledReleaseLabel.module.css'

const messages = {
  collectibleGated: 'Collectible Gated',
  specialAccess: 'Special Access',
  premium: 'Premium'
}

/** Renders a label indicating a premium content type. If the user does
 * not yet have access or is the owner, the label will be in an accented color.
 */
export const ScheduledReleaseLabel = ({ released }) => {
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

export const ScheduledReleaseGiantLabel = ({ released }) => {
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
