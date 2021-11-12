import React, { forwardRef, useContext } from 'react'

import {
  PopupMenu,
  PopupMenuItem,
  PopupMenuProps,
  PopupPosition
} from '@audius/stems'

import { MainContentContext } from 'containers/MainContentContext'

import CollectionMenu, {
  OwnProps as CollectionMenuProps
} from './CollectionMenu'
import NotificationMenu, {
  OwnProps as NotificationMenuProps
} from './NotificationMenu'
import TrackMenu, { OwnProps as TrackMenuProps } from './TrackMenu'
import UserMenu, { OwnProps as UserMenuProps } from './UserMenu'

export type MenuOptionType =
  | UserMenuProps
  | CollectionMenuProps
  | TrackMenuProps
  | NotificationMenuProps

export type MenuType = MenuOptionType['type']

export type MenuProps = {
  children: PopupMenuProps['renderTrigger']
  menu: Omit<MenuOptionType, 'children'>
  onClose?: () => void
  zIndex?: number
}

const Menu = forwardRef<HTMLDivElement, MenuProps>((props, ref) => {
  const { menu, onClose, zIndex } = props

  const { mainContentRef } = useContext(MainContentContext)

  const renderMenu = (items: PopupMenuItem[]) => (
    <PopupMenu
      items={items}
      onClose={onClose}
      position={PopupPosition.BOTTOM_RIGHT}
      ref={ref}
      renderTrigger={props.children}
      zIndex={zIndex}
      containerRef={mainContentRef}
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
})

Menu.defaultProps = {
  menu: {
    type: 'track'
  }
}

export default Menu
