import { MouseEvent } from 'react'

import {
  IconKebabHorizontal,
  PopupMenu,
  PopupMenuProps,
  IconButton,
  IconButtonProps
} from '@audius/harmony'

type EditNavItemButtonProps = Omit<IconButtonProps, 'icon'> & {
  visible: boolean
  items: PopupMenuProps['items']
}

export const NavItemKebabButton = (props: EditNavItemButtonProps) => {
  const { visible, items, ...other } = props

  return (
    <PopupMenu
      items={items}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      renderTrigger={(ref, onClick, triggerProps) => {
        const handleClick = (e: MouseEvent) => {
          e.preventDefault()
          e.stopPropagation()
          onClick()
        }

        return (
          <IconButton
            {...other}
            {...triggerProps}
            ref={ref}
            onClick={handleClick}
            css={{
              visibility: visible ? 'visible' : 'hidden',
              flexShrink: 0,
              pointerEvents: visible ? 'all' : 'none',
              '& path': {
                fill: 'var(--harmony-n-700)'
              },
              ':hover,:active,:focus,:hover path, :active path, :focus path': {
                color: 'var(--harmony-neutral)',
                fill: 'var(--harmony-n-950)'
              }
            }}
            icon={IconKebabHorizontal}
            size='xs'
            color='default'
          />
        )
      }}
    />
  )
}
