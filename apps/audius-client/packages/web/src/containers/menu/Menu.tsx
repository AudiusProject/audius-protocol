import React from 'react'

import {
  PopupMenu,
  PopupMenuItem,
  PopupMenuProps
} from 'components/general/PopupMenu'
import CollectionMenu, {
  OwnProps as CollectionMenuProps
} from './CollectionMenu'
import TrackMenu, { OwnProps as TrackMenuProps } from './TrackMenu'
import UserMenu, { OwnProps as UserMenuProps } from './UserMenu'
import NotificationMenu, {
  OwnProps as NotificationMenuProps
} from './NotificationMenu'

export type MenuOptionType =
  | UserMenuProps
  | CollectionMenuProps
  | TrackMenuProps
  | NotificationMenuProps

export type MenuProps = {
  children: PopupMenuProps['renderTrigger']
  className?: string
  menu: Omit<MenuOptionType, 'children'>
  onClose?: () => void
}

const Menu = (props: MenuProps) => {
  const { className, menu, onClose } = props

  const renderMenu = (items: PopupMenuItem[]) => (
    <PopupMenu
      items={items}
      onClose={onClose}
      position='bottomRight'
      renderTrigger={props.children}
      popupClassName={className}
      zIndex={12}
    />
  )

  if (menu.type === 'user') {
    return <UserMenu {...(menu as UserMenuProps)}>{renderMenu}</UserMenu>
  } else if (menu.type === 'album' || menu.type === 'playlist') {
    return (
      <CollectionMenu
        onClose={props.onClose}
        {...(menu as CollectionMenuProps)}
      >
        {renderMenu}
      </CollectionMenu>
    )
  } else if (menu.type === 'track') {
    return <TrackMenu {...(menu as TrackMenuProps)}>{renderMenu}</TrackMenu>
  } else if (menu.type === 'notification') {
    return (
      <NotificationMenu {...(menu as NotificationMenuProps)}>
        {renderMenu}
      </NotificationMenu>
    )
  }
  return null
}

Menu.defaultProps = {
  menu: {
    type: 'track'
  }
}

export default Menu
