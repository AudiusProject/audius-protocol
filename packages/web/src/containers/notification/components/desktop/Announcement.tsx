import React, { useCallback } from 'react'

import cn from 'classnames'
import moment from 'moment'
import ReactMarkdown from 'react-markdown'

import { ReactComponent as IconAnnouncement } from 'assets/img/iconAnnouncement.svg'
import { ReactComponent as IconAnnouncementUnread } from 'assets/img/iconAnnouncementUnread.svg'
import { ReactComponent as IconKebabHorizontal } from 'assets/img/iconKebabHorizontal.svg'
import { Name } from 'common/models/Analytics'
import Menu from 'containers/menu/Menu'
import { make, useRecord } from 'store/analytics/actions'
import zIndex from 'utils/zIndex'

import styles from './Announcement.module.css'

const messages = {
  readMore: 'Read More'
}

export type AnnouncementProps = {
  id: string
  title: string
  timestamp: string
  shortDescription: string
  longDescription?: string
  menuProps: any
  markAsRead: (id: string) => void
  setNotificationModal: (open: boolean, id: string) => void
  isRead: boolean
}

const Announcement = ({
  timestamp,
  shortDescription,
  longDescription,
  setNotificationModal,
  markAsRead,
  isRead,
  id,
  title,
  menuProps
}: AnnouncementProps) => {
  const record = useRecord()
  const displayTime = moment(timestamp).format('MMMM Do')
  const onOpenNotification = useCallback(() => {
    if (longDescription) {
      setNotificationModal(true, id)
    }
  }, [longDescription, setNotificationModal, id])

  const onContainerClick = useCallback(
    e => {
      e.stopPropagation()
      markAsRead(id)
      onOpenNotification()
      record(
        make(Name.NOTIFICATIONS_CLICK_TILE, {
          kind: 'announcement',
          link_to: ''
        })
      )
    },
    [record, markAsRead, id, onOpenNotification]
  )

  const announcementIcon = isRead ? (
    <IconAnnouncement className={styles.icon} />
  ) : (
    <IconAnnouncementUnread className={styles.icon} />
  )

  const onMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    markAsRead(id)
  }

  return (
    <div
      className={cn(styles.notification, {
        [styles.read]: isRead,
        [styles.shortDescription]: !longDescription
      })}
      onClick={onContainerClick}
    >
      <div className={styles.unReadDot}></div>
      <div className={styles.header}>
        {announcementIcon}
        <div className={styles.headerTextContainer}>
          <span className={styles.headerText}>
            <ReactMarkdown source={title} escapeHtml={false} />
          </span>
        </div>
      </div>
      <div className={styles.body}>
        <div className={styles.message}>
          <ReactMarkdown source={shortDescription} escapeHtml={false} />
        </div>
        {longDescription ? (
          <div className={styles.readMore} onClick={onOpenNotification}>
            {messages.readMore}
          </div>
        ) : null}
        <div className={styles.dateMenuContainer}>
          <span className={styles.date}>{displayTime}</span>
          <div className={styles.menuContainer} onClick={onMenuClick}>
            <Menu
              menu={menuProps}
              zIndex={zIndex.NAVIGATOR_POPUP_OVERFLOW_POPUP}
            >
              {(ref, triggerPopup) => (
                <div className={styles.iconContainer} onClick={triggerPopup}>
                  <IconKebabHorizontal
                    className={styles.iconKebabHorizontal}
                    ref={ref}
                  />
                </div>
              )}
            </Menu>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Announcement
