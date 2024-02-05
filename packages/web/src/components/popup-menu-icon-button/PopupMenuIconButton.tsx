import { ReactNode } from 'react'

import { PopupMenu, PopupMenuProps, IconButton } from '@audius/stems'
import cn from 'classnames'

import styles from './PopupMenuIconButton.module.css'

type PopupMenuIconButtonProps = {
  disabled?: boolean
  icon?: ReactNode
  iconClassName?: string
} & Omit<PopupMenuProps, 'renderTrigger'>

export const PopupMenuIconButton = (props: PopupMenuIconButtonProps) => {
  const { disabled, icon, iconClassName, ...popupMenuProps } = props

  const style = {
    [styles.disabled]: disabled
  }
  return (
    <PopupMenu
      {...popupMenuProps}
      renderTrigger={(ref, triggerPopup) => (
        <IconButton
          aria-label='open'
          ref={ref}
          className={cn(styles.icon, style, iconClassName)}
          icon={icon}
          disabled={disabled}
          onClick={() => triggerPopup()}
        />
      )}
    />
  )
}
