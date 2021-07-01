import React from 'react'

import cn from 'classnames'

import IconButton from 'components/general/IconButton'
import { PopupMenu, PopupMenuProps } from 'components/general/PopupMenu'

import styles from './PopupMenuIconButton.module.css'

type PopupMenuIconButtonProps = {
  disabled?: boolean
  icon?: React.ReactNode | Element
  iconClassName?: string
} & Omit<PopupMenuProps, 'renderTrigger'>

export const PopupMenuIconButton = (props: PopupMenuIconButtonProps) => {
  const {
    disabled,
    icon,
    iconClassName,
    popupClassName,
    ...popupMenuProps
  } = props

  const style = {
    [styles.disabled]: disabled
  }
  return (
    <PopupMenu
      popupClassName={cn(styles.popup, style, popupClassName)}
      {...popupMenuProps}
      renderTrigger={(ref, triggerPopup) => (
        <IconButton
          ref={ref}
          className={cn(styles.icon, iconClassName)}
          icon={icon}
          disabled={disabled}
          onClick={triggerPopup}
        />
      )}
    />
  )
}
