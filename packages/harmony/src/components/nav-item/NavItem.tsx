import { useMemo } from 'react'

import { useTheme } from '@emotion/react'

import { motion } from '../../foundations/motion'
import { Flex } from '../layout/Flex'
import { NotificationCount } from '../notification-count'
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
  onClick,
  textSize = 'l',
  hasNotification = false,
  ...props
}: NavItemProps) => {
  const { color } = useTheme()

  const hasLeftIcon = !!LeftIcon
  const hasRightIcon = !!RightIcon

  const backgroundColor = isSelected ? color.secondary.s400 : undefined

  const textColor = isSelected ? 'staticWhite' : 'default'

  const iconColor = isSelected ? 'staticStaticWhite' : 'default'

  const leftIconWithNotification = useMemo(() => {
    const icon = hasLeftIcon ? <LeftIcon size='l' color={iconColor} /> : null

    if (hasNotification && !!icon) {
      return (
        <NotificationCount size='s' isSelected={isSelected}>
          {icon}
        </NotificationCount>
      )
    }
    return icon
  }, [hasNotification, hasLeftIcon, LeftIcon, iconColor, isSelected])

  return (
    <Flex
      alignItems='center'
      gap='s'
      pl='s'
      pr='s'
      css={{
        width: '240px',
        cursor: 'pointer',
        transition: `background-color ${motion.hover}`
      }}
      {...props}
      onClick={onClick}
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
        <Flex
          alignItems='center'
          gap='m'
          flex={1}
          css={{
            maxWidth: '240px'
          }}
        >
          {leftIconWithNotification}
          <Text
            variant='title'
            size={textSize}
            strength='weak'
            lineHeight='single'
            color={textColor}
            ellipses
          >
            {children}
          </Text>
        </Flex>
        {hasRightIcon ? RightIcon : null}
      </Flex>
    </Flex>
  )
}
