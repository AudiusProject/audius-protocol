import styles from './EmptyNotifications.module.css'

const messages = {
  empty: 'There’s Nothing Here Yet!'
}

export const EmptyNotifications = () => {
  return (
    <div className={styles.emptyContainer}>
      <div className={styles.emptyMessage}>{messages.empty}</div>
    </div>
  )
}
