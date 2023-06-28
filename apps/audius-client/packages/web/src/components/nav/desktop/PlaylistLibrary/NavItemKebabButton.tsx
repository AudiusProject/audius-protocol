import { MouseEvent } from 'react'

import { FeatureFlags } from '@audius/common'
import {
  IconKebabHorizontal,
  IconButton,
  IconButtonButtonProps,
  PopupMenu,
  PopupMenuProps
} from '@audius/stems'
import cn from 'classnames'

import { useFlag } from 'hooks/useRemoteConfig'

import styles from './NavItemKebabButton.module.css'

type EditNavItemButtonProps = Omit<IconButtonButtonProps, 'icon'> & {
  visible: boolean
  items: PopupMenuProps['items']
}

export const NavItemKebabButton = (props: EditNavItemButtonProps) => {
  const { className, visible, items, ...other } = props

  const { isEnabled: isPlaylistUpdatesEnabled } = useFlag(
    FeatureFlags.PLAYLIST_UPDATES_POST_QA
  )

  const renderKebabButton = (buttonProps?: Partial<IconButtonButtonProps>) => {
    return (
      <IconButton
        {...other}
        {...buttonProps}
        className={cn(styles.root, className, { [styles.visible]: visible })}
        icon={<IconKebabHorizontal height={11} width={11} />}
      />
    )
  }

  const kebabMenu = (
    <PopupMenu
      items={items}
      renderTrigger={(ref, onClick, triggerProps) => {
        const handleClick = (e: MouseEvent) => {
          e.preventDefault()
          onClick()
        }
        return renderKebabButton({ ref, onClick: handleClick, ...triggerProps })
      }}
    />
  )

  return isPlaylistUpdatesEnabled ? kebabMenu : renderKebabButton()
}
