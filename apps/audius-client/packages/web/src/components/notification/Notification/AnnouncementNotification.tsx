import { useCallback } from 'react'

import {
  Name,
  AnnouncementNotification as AnnouncementNotificationType
} from '@audius/common'
import { MarkdownViewer } from '@audius/stems'
import { useDispatch } from 'react-redux'

import { make, useRecord } from 'common/store/analytics/actions'
import { openNotificationModal } from 'store/application/ui/notifications/notificationsUISlice'

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
  notification: AnnouncementNotificationType
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
    dispatch(openNotificationModal({ modalNotificationId: id }))
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
          <MarkdownViewer className={styles.title} markdown={title} />
        </NotificationTitle>
      </NotificationHeader>
      <NotificationBody className={styles.body}>
        <MarkdownViewer markdown={shortDescription} />
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
