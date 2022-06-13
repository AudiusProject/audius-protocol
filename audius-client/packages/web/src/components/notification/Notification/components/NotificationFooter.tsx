import styles from './NotificationFooter.module.css'

const messages = {
  unread: 'new'
}

type NotificationFooterProps = {
  timeLabel?: string
  isViewed: boolean
}

export const NotificationFooter = (props: NotificationFooterProps) => {
  const { timeLabel, isViewed } = props
  return (
    <div className={styles.root}>
      <span className={styles.timeLabel}>{timeLabel}</span>
      {isViewed ? null : (
        <span className={styles.unreadPill}>{messages.unread}</span>
      )}
    </div>
  )
}
