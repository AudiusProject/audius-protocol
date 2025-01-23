import { MouseEvent } from 'react'

import {
  IconKebabHorizontal,
  PopupMenu,
  PopupMenuProps,
  IconButton,
  IconButtonProps,
  useTheme
} from '@audius/harmony'

type EditNavItemButtonProps = Omit<IconButtonProps, 'icon'> & {
  visible: boolean
  items: PopupMenuProps['items']
  isSelected?: boolean
}

export const NavItemKebabButton = (props: EditNavItemButtonProps) => {
  const { visible, items, isSelected, ...other } = props
  const { color } = useTheme()

  return (
    <PopupMenu
      items={items}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
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
              ':hover,:active,:focus,:hover path, :active path, :focus path': {
                color: color.neutral.n800,
                fill: isSelected ? color.text.staticWhite : color.text.default
              }
            }}
            icon={IconKebabHorizontal}
            size='xs'
            color={isSelected ? 'white' : 'subdued'}
          />
        )
      }}
    />
  )
}
