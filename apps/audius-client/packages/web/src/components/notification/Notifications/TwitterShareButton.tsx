import React from 'react'

import { ReactComponent as IconTwitterBird } from 'assets/img/iconTwitterBird.svg'

import styles from './TwitterShareButton.module.css'

const messages = {
  share: 'Share'
}

export const TwitterShareButton = () => {
  return (
    <button className={styles.root}>
      <IconTwitterBird className={styles.icon} />
      {messages.share}
    </button>
  )
}
