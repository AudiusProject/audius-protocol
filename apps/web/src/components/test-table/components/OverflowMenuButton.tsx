import cn from 'classnames'

import { ReactComponent as IconOptions } from 'assets/img/iconKebabHorizontal.svg'
import tabStyles from 'components/actions-tab/ActionsTab.module.css'
import Menu, { MenuProps } from 'components/menu/Menu'

import styles from './OverflowMenuButton.module.css'

type OverflowMenuButtonProps = {
  albumId?: number | null
  albumName?: string | null
  className?: string
  date?: any
  handle: string
  hiddenUntilHover?: boolean
  index?: number
  isArtistPick?: boolean
  isDeleted?: boolean
  isFavorited?: boolean
  isOwner?: boolean
  isOwnerDeactivated?: boolean
  isReposted?: boolean
  onClick?: (e: any) => void
  onRemove?: (trackId: number, index: number, uid: string, date: number) => void
  removeText?: string
  trackId?: number
  trackPermalink?: string
  trackTitle?: string
  uid?: string
}

export const OverflowMenuButton = (props: OverflowMenuButtonProps) => {
  const {
    className,
    date,
    index,
    isFavorited,
    isOwnerDeactivated,
    onClick,
    onRemove,
    removeText,
    trackId,
    uid
  } = props

  const removeMenuItem = {
    text: removeText,
    onClick: () => {
      if (trackId && index && uid) {
        onRemove?.(trackId, index, uid, date?.unix())
      }
    }
  }

  const overflowMenu = {
    menu: {
      type: 'track' as MenuProps['menu']['type'],
      mount: 'page',
      includeShare: true,
      ...props,
      extraMenuItems: onRemove ? [removeMenuItem] : []
    }
  }

  if (isOwnerDeactivated && !onRemove && !isFavorited) {
    return null
  }

  return (
    <div onClick={onClick} className={cn(styles.tableOptionsButton, className)}>
      <Menu {...overflowMenu}>
        {(ref, triggerPopup) => (
          <div
            className={tabStyles.iconKebabHorizontalWrapper}
            onClick={(e) => {
              e.stopPropagation()
              triggerPopup()
            }}
          >
            <IconOptions
              className={cn(tabStyles.iconKebabHorizontal, styles.icon)}
              ref={ref}
            />
          </div>
        )}
      </Menu>
    </div>
  )
}
