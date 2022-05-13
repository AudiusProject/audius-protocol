import React, { useCallback } from 'react'

import ReactMarkdown from 'react-markdown'
import { useDispatch } from 'react-redux'

import { Name } from 'common/models/Analytics'
import { setNotificationModal } from 'common/store/notifications/actions'
import { Announcement } from 'common/store/notifications/types'
import { make, useRecord } from 'store/analytics/actions'

import styles from './AnnouncementNotification.module.css'
import { NotificationBody } from './NotificationBody'
import { NotificationFooter } from './NotificationFooter'
import { NotificationHeader } from './NotificationHeader'
import { NotificationTile } from './NotificationTile'
import { NotificationTitle } from './NotificationTitle'
import { IconAnnouncement } from './icons'

const messages = {
  readMore: 'Read More'
}

type AnnouncementNotificationProps = {
  notification: Announcement
}

export const AnnouncementNotification = (
  props: AnnouncementNotificationProps
) => {
  const { notification } = props
  const {
    id,
    title,
    shortDescription,
    longDescription,
    timeLabel,
    isRead
  } = notification
  const dispatch = useDispatch()
  const record = useRecord()

  const handleOpenNotificationModal = useCallback(() => {
    dispatch(setNotificationModal(true, id))
  }, [dispatch, id])

  const handleClick = useCallback(() => {
    handleOpenNotificationModal()
    record(
      make(Name.NOTIFICATIONS_CLICK_TILE, { kind: 'announcement', link_to: '' })
    )
  }, [handleOpenNotificationModal, record])

  return (
    <NotificationTile
      notification={notification}
      onClick={handleClick}
      disableClosePanel
    >
      <NotificationHeader icon={<IconAnnouncement />}>
        <NotificationTitle>
          <ReactMarkdown source={title} escapeHtml={false} />
        </NotificationTitle>
      </NotificationHeader>
      <NotificationBody className={styles.body}>
        <ReactMarkdown source={shortDescription} escapeHtml={false} />
        {longDescription ? (
          <button
            className={styles.readMore}
            onClick={handleOpenNotificationModal}
          >
            {messages.readMore}
          </button>
        ) : null}
      </NotificationBody>
      <NotificationFooter timeLabel={timeLabel} isRead={isRead} />
    </NotificationTile>
  )
}
