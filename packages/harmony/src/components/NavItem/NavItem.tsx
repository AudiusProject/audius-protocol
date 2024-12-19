import { useTheme } from '@emotion/react'

import { Flex } from '../layout/Flex'
import { Text } from '../text/Text'

import type { NavItemProps } from './types'

/**
 * A navigation item component, typically used in sidebars or navigation menus.
 * Supports default, hover, and selected states, as well as optional left and right icons.
 */
export const NavItem = ({
  children,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  isSelected = false,
  ...props
}: NavItemProps) => {
  const { color } = useTheme()

  const hasLeftIcon = !!LeftIcon
  const hasRightIcon = !!RightIcon

  const backgroundColor = isSelected ? color.secondary.s400 : undefined

  const textColor = isSelected ? 'staticWhite' : 'default'

  const iconColor = isSelected ? color.static.staticWhite : color.neutral.n800

  return (
    <Flex
      alignItems='center'
      gap='s'
      pl='s'
      pr='s'
      css={{
        width: '240px',
        cursor: 'pointer',
        transition: 'background-color 0.18s ease-in-out'
      }}
      {...props}
    >
      <Flex
        alignItems='center'
        flex={1}
        gap='m'
        p='s'
        borderRadius='m'
        css={{
          backgroundColor,
          borderWidth: '1px',

          '&:hover': {
            backgroundColor: isSelected ? undefined : color.background.surface2,
            borderColor: color.border.default
          }
        }}
      >
        <Flex alignItems='center' gap='m' flex={1}>
          {hasLeftIcon && <LeftIcon color={iconColor} />}
          <Text
            variant='title'
            size='l'
            strength='weak'
            lineHeight='single'
            color={textColor}
            css={{
              whiteSpace: 'nowrap'
            }}
          >
            {children}
          </Text>
        </Flex>
        {hasRightIcon && <RightIcon color={iconColor} />}
      </Flex>
    </Flex>
  )
}
