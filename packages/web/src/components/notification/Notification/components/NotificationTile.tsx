import React, {
  MouseEventHandler,
  ReactEventHandler,
  ReactNode,
  useCallback
} from 'react'

import cn from 'classnames'
import { useDispatch } from 'react-redux'

import {
  markAsRead,
  toggleNotificationPanel
} from 'common/store/notifications/actions'
import { Notification } from 'common/store/notifications/types'

import styles from './NotificationTile.module.css'

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
  const { id, isRead } = notification
  const dispatch = useDispatch()

  const handleClick: MouseEventHandler = useCallback(
    event => {
      onClick?.(event)
      dispatch(markAsRead(id))
      if (!disableClosePanel) {
        dispatch(toggleNotificationPanel())
      }
    },
    [onClick, id, disableClosePanel, dispatch]
  )

  return (
    <div
      className={cn(styles.root, {
        [styles.read]: isRead,
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
