import React, { ReactEventHandler, ReactNode } from 'react'

import cn from 'classnames'

import { Notification } from 'common/store/notifications/types'

import styles from './NotificationTile.module.css'

type NotificationTileProps = {
  notification: Notification
  children: ReactNode
  onClick?: ReactEventHandler
  // When `true` disable :active transforms
  disabled?: boolean
}

export const NotificationTile = (props: NotificationTileProps) => {
  const { notification, onClick, children, disabled } = props
  const { isRead } = notification

  return (
    <div
      className={cn(styles.root, {
        [styles.read]: isRead,
        [styles.active]: !disabled
      })}
      tabIndex={0}
      role='button'
      onClick={onClick}
    >
      {children}
    </div>
  )
}
