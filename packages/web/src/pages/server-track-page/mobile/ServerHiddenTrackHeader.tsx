import { IconVisibilityHidden, Text } from '@audius/harmony'

import styles from '../../track-page/components/HiddenTrackHeader.module.css'

const messages = {
  hiddenTrackTitle: 'Hidden Track'
}

// Presents the Hidden Track title. Extracted for use in mobile and desktop
// track pages.
export const ServerHiddenTrackHeader = () => {
  return (
    <span className={styles.root}>
      <IconVisibilityHidden className={styles.icon} />
      <Text variant='title' size='s' strength='weak' className={styles.label}>
        {messages.hiddenTrackTitle}
      </Text>
    </span>
  )
}
