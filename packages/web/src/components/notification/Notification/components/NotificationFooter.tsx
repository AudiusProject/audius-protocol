import { Pill } from '@audius/harmony'

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
      {isViewed ? null : <Pill variant='active'>{messages.unread}</Pill>}
    </div>
  )
}
