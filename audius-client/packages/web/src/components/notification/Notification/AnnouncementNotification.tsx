import { useCallback } from 'react'

import { Name } from '@audius/common'
import ReactMarkdown from 'react-markdown'
import { useDispatch } from 'react-redux'

import { setNotificationModal } from 'common/store/notifications/actions'
import { Announcement } from 'common/store/notifications/types'
import { make, useRecord } from 'store/analytics/actions'

import styles from './AnnouncementNotification.module.css'
import { NotificationBody } from './components/NotificationBody'
import { NotificationFooter } from './components/NotificationFooter'
import { NotificationHeader } from './components/NotificationHeader'
import { NotificationTile } from './components/NotificationTile'
import { NotificationTitle } from './components/NotificationTitle'
import { IconAnnouncement } from './components/icons'

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
  const { id, title, shortDescription, longDescription, timeLabel, isViewed } =
    notification
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
      <NotificationFooter timeLabel={timeLabel} isViewed={isViewed} />
    </NotificationTile>
  )
}
