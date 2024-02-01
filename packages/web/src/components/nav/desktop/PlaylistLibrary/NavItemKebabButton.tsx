import { MouseEvent } from 'react'

import {
  IconButton,
  IconButtonButtonProps,
  PopupMenu,
  PopupMenuProps
} from '@audius/stems'
import { IconKebabHorizontal } from '@audius/harmony'
import cn from 'classnames'

import styles from './NavItemKebabButton.module.css'

type EditNavItemButtonProps = Omit<IconButtonButtonProps, 'icon'> & {
  visible: boolean
  items: PopupMenuProps['items']
}

export const NavItemKebabButton = (props: EditNavItemButtonProps) => {
  const { className, visible, items, ...other } = props

  return (
    <PopupMenu
      items={items}
      renderTrigger={(ref, onClick, triggerProps) => {
        const handleClick = (e: MouseEvent) => {
          e.preventDefault()
          onClick()
        }

        return (
          <IconButton
            {...other}
            {...triggerProps}
            ref={ref}
            onClick={handleClick}
            className={cn(styles.root, className, {
              [styles.visible]: visible
            })}
            icon={<IconKebabHorizontal height={11} width={11} />}
          />
        )
      }}
    />
  )
}
