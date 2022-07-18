import { Modal, Scrollbar } from '@audius/stems'
import ReactMarkdown from 'react-markdown'

import { ReactComponent as IconRemove } from 'assets/img/iconRemove.svg'
import { Announcement } from 'common/store/notifications/types'

import { IconAnnouncement } from './Notification/components/icons'
import styles from './NotificationModal.module.css'

type NotificationModalProps = {
  isOpen?: boolean
  onClose: () => void
  notification: Announcement | null
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
      onClose={onClose}>
      <div className={styles.panelContainer}>
        <div className={styles.header}>
          <IconRemove className={styles.iconRemove} onClick={onClose} />
          <IconAnnouncement />
          <div className={styles.title}>
            <ReactMarkdown source={notification.title} escapeHtml={false} />
          </div>
        </div>
        <Scrollbar className={styles.scrollContent}>
          <div className={styles.body}>
            <ReactMarkdown
              source={notification.longDescription}
              escapeHtml={false}
            />
          </div>
        </Scrollbar>
      </div>
    </Modal>
  )
}
