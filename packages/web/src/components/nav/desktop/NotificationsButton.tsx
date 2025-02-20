import { useCallback, useMemo, useRef, MouseEvent, useEffect } from 'react'

import { useNotificationUnreadCount } from '@audius/common/api'
import { Name } from '@audius/common/models'
import { accountSelectors } from '@audius/common/store'
import { IconNotificationOn, NotificationCount } from '@audius/harmony'
import { useSelector } from 'react-redux'
import { useSearchParam, useToggle } from 'react-use'

import { useRecord, make } from 'common/store/analytics/actions'
import { NotificationPanel } from 'components/notification'
import { AnnouncementModal } from 'components/notification/AnnouncementModal'
import { useRequiresAccountFn } from 'hooks/useRequiresAccount'

import { canAccess } from './NavHeader'
import { NavHeaderButton } from './NavHeaderButton'

const { getHasAccount, getIsAccountComplete } = accountSelectors

const messages = {
  label: (count: number) => `${count} unread notifications`
}

export const NotificationsButton = () => {
  const { data: notificationCount = 0 } = useNotificationUnreadCount()
  const hasAccount = useSelector(getHasAccount)
  const isAccountComplete = useSelector(getIsAccountComplete)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [isNotificationPanelOpen, toggleIsNotificationPanelOpen] =
    useToggle(false)

  const record = useRecord()
  const { requiresAccount } = useRequiresAccountFn(undefined, 'account')
  const shouldOpenNotifications = useSearchParam('openNotifications')

  useEffect(() => {
    if (shouldOpenNotifications) {
      toggleIsNotificationPanelOpen()
    }
  }, [shouldOpenNotifications, toggleIsNotificationPanelOpen])

  const handleToggleNotificationPanel = useCallback(
    (e: MouseEvent) => {
      if (!canAccess('account', hasAccount, isAccountComplete)) {
        e.preventDefault()
        requiresAccount()
        return
      }

      toggleIsNotificationPanelOpen()

      record(make(Name.NOTIFICATIONS_OPEN, { source: 'button' }))
    },
    [
      hasAccount,
      isAccountComplete,
      toggleIsNotificationPanelOpen,
      record,
      requiresAccount
    ]
  )

  const shouldShowCount = notificationCount > 0 && !isNotificationPanelOpen
  const notificationButton = useMemo(() => {
    const button = (
      <NavHeaderButton
        ref={buttonRef}
        icon={IconNotificationOn}
        aria-label={messages.label(notificationCount)}
        onClick={handleToggleNotificationPanel}
        isActive={isNotificationPanelOpen}
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
    isNotificationPanelOpen,
    shouldShowCount
  ])

  return (
    <>
      {notificationButton}
      <NotificationPanel
        anchorRef={buttonRef}
        isOpen={isNotificationPanelOpen}
        onClose={toggleIsNotificationPanelOpen}
      />
      <AnnouncementModal />
    </>
  )
}
