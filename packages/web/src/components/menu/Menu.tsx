import { forwardRef, useContext } from 'react'

import { PopupMenu, PopupMenuItem, PopupMenuProps } from '@audius/harmony'

import { MainContentContext } from 'pages/MainContentContext'

import CollectionMenu, {
  OwnProps as CollectionMenuProps
} from './CollectionMenu'
import TrackMenu, { OwnProps as TrackMenuProps } from './TrackMenu'
import UserMenu, { OwnProps as UserMenuProps } from './UserMenu'

export type MenuOptionType =
  | Omit<UserMenuProps, 'children'>
  | Omit<CollectionMenuProps, 'children'>
  | Omit<TrackMenuProps, 'children'>

export type MenuType = MenuOptionType['type']

export type MenuProps = {
  children: PopupMenuProps['renderTrigger']
  menu: MenuOptionType
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
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      ref={ref}
      renderTrigger={props.children}
      zIndex={zIndex}
      containerRef={mainContentRef}
    />
  )

  if (menu.type === 'user') {
    return <UserMenu {...menu}>{renderMenu}</UserMenu>
  } else if (menu.type === 'album' || menu.type === 'playlist') {
    return (
      <CollectionMenu onClose={props.onClose} {...menu}>
        {renderMenu}
      </CollectionMenu>
    )
  } else if (menu.type === 'track') {
    return <TrackMenu {...menu}>{renderMenu}</TrackMenu>
  } else if (menu.type === 'notification') {
  }
  return null
})

export default Menu
