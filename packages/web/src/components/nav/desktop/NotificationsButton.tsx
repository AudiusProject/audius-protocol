import { useCallback, useRef } from 'react'

import { Name } from '@audius/common/models'
import { notificationsSelectors } from '@audius/common/store'
import { formatCount } from '@audius/common/utils'
import { Text, IconNotificationOn, TextProps, useTheme } from '@audius/harmony'
import { CSSObject } from '@emotion/styled'
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

const NotificationCount = (props: TextProps) => {
  const { color, cornerRadius, spacing } = useTheme()
  const css: CSSObject = {
    position: 'absolute',
    top: -7,
    right: 0,
    transform: 'translateX(50%)',
    borderRadius: cornerRadius.m,
    backgroundColor: color.text.danger,
    color: color.text.staticWhite,
    paddingLeft: spacing.xs,
    paddingRight: spacing.xs
  }

  return <Text variant='label' size='s' css={css} {...props} />
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

  return (
    <>
      <NavHeaderButton
        ref={buttonRef}
        icon={IconNotificationOn}
        aria-label={messages.label(notificationCount)}
        onClick={handleToggleNotificationPanel}
        isActive={notificationPanelIsOpen}
        css={(theme) =>
          notificationCount > 0
            ? {
                backgroundColor: theme.color.icon.warning,
                svg: { path: { fill: theme.color.static.white } },
                '&:hover,&:active': {
                  backgroundColor: theme.color.icon.warning,
                  svg: { path: { fill: theme.color.static.white } }
                }
              }
            : null
        }
      >
        {notificationCount > 0 && !notificationPanelIsOpen ? (
          <NotificationCount>
            {formatCount(notificationCount)}
          </NotificationCount>
        ) : null}
      </NavHeaderButton>
      <NotificationPanel anchorRef={buttonRef} />
    </>
  )
}
