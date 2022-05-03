import React, { ReactEventHandler, ReactNode } from 'react'

import cn from 'classnames'

import { Notification } from 'common/store/notifications/types'

import styles from './NotificationTile.module.css'

type NotificationTileProps = {
  notification: Notification
  children: ReactNode
  onClick?: ReactEventHandler
}

export const NotificationTile = (props: NotificationTileProps) => {
  const { notification, onClick, children } = props
  const { isRead } = notification
  return (
    <div
      className={cn(styles.root, { [styles.rootRead]: isRead })}
      tabIndex={0}
      role='button'
      onClick={onClick}
    >
      {children}
    </div>
  )
}
