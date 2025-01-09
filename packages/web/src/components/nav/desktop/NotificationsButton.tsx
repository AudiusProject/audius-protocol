import { useCallback, useMemo, useRef } from 'react'

import { Name } from '@audius/common/models'
import { notificationsSelectors } from '@audius/common/store'
import { IconNotificationOn, NotificationCount } from '@audius/harmony'
import { useDispatch, useSelector } from 'react-redux'

import { useRecord, make } from 'common/store/analytics/actions'
import { NotificationPanel } from 'components/notification'
import { getNotificationPanelIsOpen } from 'store/application/ui/notifications/notificationsUISelectors'
import {
  closeNotificationPanel,
  openNotificationPanel
} from 'store/application/ui/notifications/notificationsUISlice'

import { NavHeaderButton } from './NavHeaderButton'

const { getNotificationUnviewedCount } = notificationsSelectors

const messages = {
  label: (count: number) => `${count} unread notifications`
}

export const NotificationsButton = () => {
  const notificationCount = useSelector(getNotificationUnviewedCount)
  const notificationPanelIsOpen = useSelector(getNotificationPanelIsOpen)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const dispatch = useDispatch()
  const record = useRecord()

  const handleToggleNotificationPanel = useCallback(() => {
    if (!notificationPanelIsOpen) {
      dispatch(openNotificationPanel())
      record(make(Name.NOTIFICATIONS_OPEN, { source: 'button' }))
    } else {
      dispatch(closeNotificationPanel())
    }
  }, [notificationPanelIsOpen, dispatch, record])

  const shouldShowCount = notificationCount > 0 && !notificationPanelIsOpen
  const notificationButton = useMemo(() => {
    const button = (
      <NavHeaderButton
        ref={buttonRef}
        icon={IconNotificationOn}
        aria-label={messages.label(notificationCount)}
        onClick={handleToggleNotificationPanel}
        isActive={notificationPanelIsOpen}
      />
    )
    if (shouldShowCount) {
      return (
        <NotificationCount size='m' count={notificationCount}>
          {button}
        </NotificationCount>
      )
    }
    return button
  }, [
    notificationCount,
    handleToggleNotificationPanel,
    notificationPanelIsOpen,
    shouldShowCount
  ])

  return (
    <>
      {notificationButton}
      <NotificationPanel anchorRef={buttonRef} />
    </>
  )
}
