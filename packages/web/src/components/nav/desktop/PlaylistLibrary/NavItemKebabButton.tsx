import { MouseEvent } from 'react'

import {
  IconKebabHorizontal,
  PopupMenu,
  PopupMenuProps,
  IconButton,
  IconButtonProps
} from '@audius/harmony'
import cn from 'classnames'

import styles from './NavItemKebabButton.module.css'

type EditNavItemButtonProps = Omit<IconButtonProps, 'icon'> & {
  visible: boolean
  items: PopupMenuProps['items']
}

export const NavItemKebabButton = (props: EditNavItemButtonProps) => {
  const { className, visible, items, ...other } = props

  return (
    <PopupMenu
      items={items}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
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
            icon={IconKebabHorizontal}
            size='xs'
            color='default'
          />
        )
      }}
    />
  )
}
