import AntModal from 'antd/lib/modal'
import ReactMarkdown from 'react-markdown'
import SimpleBar from 'simplebar-react'

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
    <AntModal
      wrapClassName={styles.modalContainerWrapper}
      className={styles.modalContainer}
      visible={isOpen}
      centered
      width={720}
      closable={false}
      onCancel={onClose}
      footer={null}
      destroyOnClose>
      <div className={styles.panelContainer}>
        <div className={styles.header}>
          <IconRemove className={styles.iconRemove} onClick={onClose} />
          <IconAnnouncement />
          <div className={styles.title}>
            <ReactMarkdown source={notification.title} escapeHtml={false} />
          </div>
        </div>
        <SimpleBar className={styles.scrollContent}>
          <div className={styles.body}>
            <ReactMarkdown
              source={notification.longDescription}
              escapeHtml={false}
            />
          </div>
        </SimpleBar>
      </div>
    </AntModal>
  )
}
