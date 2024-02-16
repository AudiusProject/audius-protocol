import { AnnouncementNotification } from '@audius/common/store'
import { Modal, Scrollbar, IconClose as IconRemove } from '@audius/harmony'
import { MarkdownViewer } from '@audius/stems'

import { IconAnnouncement } from './Notification/components/icons'
import styles from './NotificationModal.module.css'

type NotificationModalProps = {
  isOpen?: boolean
  onClose: () => void
  notification: AnnouncementNotification | null
}

/** The NotificationModal is a modal that renders the
 * full notification with markdown */
export const NotificationModal = (props: NotificationModalProps) => {
  const { isOpen, onClose, notification } = props

  if (!notification) return null

  return (
    <Modal
      bodyClassName={styles.modalContainer}
      isOpen={!!isOpen}
      showDismissButton
      onClose={onClose}
    >
      <div className={styles.panelContainer}>
        <div className={styles.header}>
          <IconRemove className={styles.iconRemove} onClick={onClose} />
          <IconAnnouncement />
          <div className={styles.title}>
            <MarkdownViewer
              className={styles.titleMarkdown}
              markdown={notification.title}
            />
          </div>
        </div>
        <Scrollbar className={styles.scrollContent}>
          <div className={styles.body}>
            <MarkdownViewer markdown={notification.longDescription ?? ''} />
          </div>
        </Scrollbar>
      </div>
    </Modal>
  )
}
