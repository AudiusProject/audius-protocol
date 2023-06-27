import { IconHidden } from '@audius/stems'

import styles from './HiddenTrackHeader.module.css'

const messages = {
  hiddenTrackTitle: 'Hidden Track'
}

// Presents the Hidden Track title. Extracted for use in mobile and desktop
// track pages.
const HiddenTrackHeader = () => {
  return (
    <span className={styles.root}>
      <IconHidden className={styles.icon} />
      <div className={styles.label}>{messages.hiddenTrackTitle}</div>
    </span>
  )
}

export default HiddenTrackHeader
