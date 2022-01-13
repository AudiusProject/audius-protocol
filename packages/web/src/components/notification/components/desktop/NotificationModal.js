import React from 'react'

import AntModal from 'antd/lib/modal'
import PropTypes from 'prop-types'
import ReactMarkdown from 'react-markdown'
import SimpleBar from 'simplebar-react'

import { ReactComponent as IconAnnouncementUnread } from 'assets/img/iconAnnouncementUnread.svg'
import { ReactComponent as IconRemove } from 'assets/img/iconRemove.svg'

import styles from './NotificationModal.module.css'

/** The NotificationModal is a modal that renders the
 * full notification with markdown */
const NotificationModal = ({ isOpen, onClose, notification }) => {
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
      destroyOnClose
    >
      <div className={styles.panelContainer}>
        <div className={styles.header}>
          <IconRemove className={styles.iconRemove} onClick={onClose} />
          <IconAnnouncementUnread className={styles.iconAnnouncement} />
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

NotificationModal.propTypes = {
  isOpen: PropTypes.bool,
  notification: PropTypes.object,
  onClose: PropTypes.func
}

export default NotificationModal
