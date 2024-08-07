import { useCallback, useRef } from 'react'

import { Name } from '@audius/common/models'
import { notificationsSelectors } from '@audius/common/store'
import { formatCount } from '@audius/common/utils'
import {
  Text,
  IconNotificationOn,
  TextProps,
  useTheme,
  Flex
} from '@audius/harmony'
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
  const { color, cornerRadius } = useTheme()
  const backgroundCss: CSSObject = {
    position: 'absolute',
    top: 2,
    right: 2,
    transform: 'translate(50%, -50%)',
    borderRadius: cornerRadius.m,
    backgroundColor: color.special.orange,
    minWidth: '14px',
    minHeight: '14px'
  }
  const textCss: CSSObject = {
    color: color.text.staticWhite,
    fontSize: '11px',
    lineHeight: '14px',
    fontWeight: 700
  }

  return (
    <Flex
      ph='2xs'
      justifyContent='center'
      alignItems='center'
      css={backgroundCss}
    >
      <Text variant='label' css={textCss} {...props} />
    </Flex>
  )
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
