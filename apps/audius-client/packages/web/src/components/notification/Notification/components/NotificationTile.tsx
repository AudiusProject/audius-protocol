import {
  MouseEventHandler,
  ReactEventHandler,
  ReactNode,
  useCallback
} from 'react'

import { notificationsActions, Notification } from '@audius/common'
import cn from 'classnames'
import { useDispatch } from 'react-redux'

import styles from './NotificationTile.module.css'
const { toggleNotificationPanel } = notificationsActions

type NotificationTileProps = {
  notification: Notification
  children: ReactNode
  onClick?: ReactEventHandler
  // When `true` disable :active transforms
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
        dispatch(toggleNotificationPanel())
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
