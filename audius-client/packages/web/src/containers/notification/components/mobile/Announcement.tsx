import React, { useCallback } from 'react'

import { IconKebabHorizontal } from '@audius/stems'
import cn from 'classnames'
import moment from 'moment'
import ReactMarkdown from 'react-markdown'

import { ReactComponent as IconAnnouncement } from 'assets/img/iconAnnouncement.svg'
import { ReactComponent as IconAnnouncementUnread } from 'assets/img/iconAnnouncementUnread.svg'
import { Name } from 'common/models/Analytics'
import IconButton from 'components/general/IconButton'
import { make, useRecord } from 'store/analytics/actions'

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
  markAsRead: (id: string) => void
  onClickOverflow: (id: string) => void
  goToAnnouncementPage: () => void
  isRead: boolean
}

const Announcement = ({
  timestamp,
  shortDescription,
  longDescription,
  markAsRead,
  isRead,
  id,
  title,
  onClickOverflow,
  goToAnnouncementPage
}: AnnouncementProps) => {
  const record = useRecord()
  const displayTime = moment(timestamp).format('MMMM Do')
  const onOpenNotification = useCallback(() => {
    if (longDescription) {
      goToAnnouncementPage()
    }
  }, [goToAnnouncementPage, longDescription])

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

  const onOptionsClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      markAsRead(id)
      onClickOverflow(id)
    },
    [markAsRead, id, onClickOverflow]
  )

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
          <div className={styles.readMore}>{messages.readMore}</div>
        ) : null}
        <div className={styles.dateMenuContainer}>
          <span className={styles.date}>{displayTime}</span>
          <div className={styles.iconContainer}>
            <IconButton
              className={styles.menu}
              icon={<IconKebabHorizontal />}
              onClick={onOptionsClick}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Announcement
