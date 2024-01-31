import {
  MouseEventHandler,
  ReactEventHandler,
  ReactNode,
  useCallback
} from 'react'

import { Notification } from '@audius/common/store'

import {} from '@audius/common'
import cn from 'classnames'
import { useDispatch } from 'react-redux'

import { closeNotificationPanel } from 'store/application/ui/notifications/notificationsUISlice'

import styles from './NotificationTile.module.css'

type NotificationTileProps = {
  notification: Notification
  children: ReactNode
  onClick?: ReactEventHandler
  // When `true` disable :active and :hover transforms
  disabled?: boolean
  // When `true` do not close notification panel onClick
  disableClosePanel?: boolean
}

export const NotificationTile = (props: NotificationTileProps) => {
  const { notification, onClick, children, disabled, disableClosePanel } = props
  const { isViewed } = notification
  const dispatch = useDispatch()

  const handleClick: MouseEventHandler = useCallback(
    (event) => {
      onClick?.(event)
      if (!disableClosePanel) {
        dispatch(closeNotificationPanel())
      }
    },
    [onClick, disableClosePanel, dispatch]
  )

  return (
    <div
      className={cn(styles.root, {
        [styles.read]: isViewed,
        [styles.active]: !disabled
      })}
      tabIndex={0}
      role='button'
      onClick={handleClick}
    >
      {children}
    </div>
  )
}
