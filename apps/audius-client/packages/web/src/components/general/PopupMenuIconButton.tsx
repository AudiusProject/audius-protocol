import React from 'react'

import { PopupMenu, PopupMenuProps } from '@audius/stems'
import cn from 'classnames'

import IconButton from 'components/general/IconButton'

import styles from './PopupMenuIconButton.module.css'

type PopupMenuIconButtonProps = {
  disabled?: boolean
  icon?: React.ReactNode | Element
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
          ref={ref}
          className={cn(styles.icon, style, iconClassName)}
          icon={icon}
          disabled={disabled}
          onClick={triggerPopup}
        />
      )}
    />
  )
}
