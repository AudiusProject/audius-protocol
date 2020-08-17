import React from 'react'

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
  children: JSX.Element
  menu: MenuOptionType
  className?: string
  onClose?: () => void
}

const Menu = (props: MenuProps) => {
  const { menu, className } = props

  if (menu.type === 'user') {
    return <UserMenu {...(menu as UserMenuProps)}>{props.children}</UserMenu>
  } else if (menu.type === 'album' || menu.type === 'playlist') {
    return (
      <CollectionMenu
        className={className}
        onClose={props.onClose}
        {...(menu as CollectionMenuProps)}
      >
        {props.children}
      </CollectionMenu>
    )
  } else if (menu.type === 'track') {
    return (
      <TrackMenu {...(menu as TrackMenuProps)} className={className}>
        {props.children}
      </TrackMenu>
    )
  } else if (menu.type === 'notification') {
    return (
      <NotificationMenu {...(menu as NotificationMenuProps)}>
        {props.children}
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
