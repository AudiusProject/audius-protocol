import {
  MouseEventHandler,
  ReactEventHandler,
  ReactNode,
  useCallback
} from 'react'

import { Notification, useNotificationModal } from '@audius/common/store'
import cn from 'classnames'

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
  const { onClose } = useNotificationModal()

  const handleClick: MouseEventHandler = useCallback(
    (event) => {
      onClick?.(event)
      if (!disableClosePanel) {
        onClose()
      }
    },
    [onClick, disableClosePanel, onClose]
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
