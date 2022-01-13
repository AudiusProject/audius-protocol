import React from 'react'

import { ReactComponent as IconHidden } from 'assets/img/iconHidden.svg'

import styles from './HiddenTrackHeader.module.css'

const messages = {
  hiddenTrackTitle: 'HIDDEN TRACK'
}

// Presents the Hidden Track title. Extracted for use in mobile and desktop
// track pages.
const HiddenTrackHeader = () => {
  return (
    <div className={styles.hiddenHeaderContainer}>
      <IconHidden />
      <div className={styles.hiddenTrackLabel}>{messages.hiddenTrackTitle}</div>
    </div>
  )
}

export default HiddenTrackHeader
