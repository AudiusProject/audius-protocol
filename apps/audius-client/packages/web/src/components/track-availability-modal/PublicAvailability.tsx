import { IconVisibilityPublic } from '@audius/stems'
import cn from 'classnames'

import styles from './TrackAvailabilityModal.module.css'
import { TrackAvailabilitySelectionProps } from './types'

const messages = {
  public: 'Public (Default)',
  publicSubtitle:
    'Public uploads will appear throughout Audius and will be visible to all users.'
}

export const PublicAvailability = ({
  selected,
  updatePublicField
}: TrackAvailabilitySelectionProps) => {
  return (
    <div className={cn(styles.radioItem, { [styles.selected]: selected })}>
      <div
        className={styles.availabilityRowContent}
        onClick={updatePublicField}
      >
        <div className={styles.availabilityRowTitle}>
          <IconVisibilityPublic className={styles.availabilityRowIcon} />
          <span>{messages.public}</span>
        </div>
        <div className={styles.availabilityRowDescription}>
          {messages.publicSubtitle}
        </div>
      </div>
    </div>
  )
}
