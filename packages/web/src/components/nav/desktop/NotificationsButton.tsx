import { MouseEvent, useCallback, useEffect, useMemo, useRef } from 'react'

import {
  selectIsAccountComplete,
  useCurrentAccountUser,
  useHasAccount,
  useNotificationUnreadCount
} from '@audius/common/api'
import { Name } from '@audius/common/models'
import { Flex, IconNotificationOn, NotificationCount } from '@audius/harmony'
import { useSearchParam, useToggle } from 'react-use'

import { make, useRecord } from 'common/store/analytics/actions'
import { NotificationPanel } from 'components/notification'
import { AnnouncementModal } from 'components/notification/AnnouncementModal'
import { useRequiresAccountFn } from 'hooks/useRequiresAccount'

import { canAccess } from './NavHeader'
import { NavHeaderButton } from './NavHeaderButton'

const messages = {
  label: (count: number) => `${count} unread notifications`
}

export const NotificationsButton = () => {
  const { data: notificationCount = 0 } = useNotificationUnreadCount()
  const hasAccount = useHasAccount()
  const { data: isAccountComplete = false } = useCurrentAccountUser({
    select: selectIsAccountComplete
  })
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
        isActive={isNotificationPanelOpen}
      />
    )
    if (shouldShowCount) {
      return (
        <Flex
          css={{ cursor: 'pointer' }}
          onClick={handleToggleNotificationPanel}
        >
          <NotificationCount size='m' count={notificationCount}>
            {button}
          </NotificationCount>
        </Flex>
      )
    }
    return <Flex onClick={handleToggleNotificationPanel}>{button}</Flex>
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
