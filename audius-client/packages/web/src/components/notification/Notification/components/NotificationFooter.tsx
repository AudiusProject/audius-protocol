import React from 'react'

import styles from './NotificationFooter.module.css'

const messages = {
  unread: 'new'
}

type NotificationFooterProps = {
  timeLabel?: string
  isRead: boolean
}

export const NotificationFooter = (props: NotificationFooterProps) => {
  const { timeLabel, isRead } = props
  return (
    <div className={styles.root}>
      <span className={styles.timeLabel}>{timeLabel}</span>
      {isRead ? null : (
        <span className={styles.unreadPill}>{messages.unread}</span>
      )}
    </div>
  )
}
