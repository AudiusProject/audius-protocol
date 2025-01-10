import { useTheme, CSSObject } from '@emotion/react'

import { formatCount } from '~harmony/utils/formatCount'

import { Flex } from '../layout/Flex'
import { Text } from '../text/Text'

import type { NotificationCountProps } from './types'

/**
 * A small badge that displays a notification count and can wrap an icon, typically used with icons or buttons
 * to indicate unread or pending notifications.
 */
export const NotificationCount = ({
  count,
  size,
  children,
  isSelected = false,
  hasBorder = true,
  ...props
}: NotificationCountProps) => {
  const { spacing, color } = useTheme()

  const getDimension = (size?: NotificationCountProps['size']) => {
    const borderAdjustment = hasBorder ? 2 : 0
    switch (size) {
      case 's':
        return spacing.unit2 + borderAdjustment
      case 'm':
        return spacing.unit4 + borderAdjustment
      default:
        return spacing.unit5 + borderAdjustment
    }
  }

  const getBorderColor = () => {
    if (!hasBorder) return 'none'
    return isSelected ? color.secondary.s400 : color.background.surface1
  }

  const containerStyles: CSSObject = children
    ? {
        position: 'relative'
      }
    : {}

  const badgeStyles: CSSObject = {
    minWidth: getDimension(size),
    backgroundColor: isSelected
      ? color.background.surface1
      : color.primary.p300,
    border: hasBorder ? `1px solid ${getBorderColor()}` : 'none',
    ...(children && {
      position: 'absolute',
      top: 0,
      right: 0,
      transform: 'translate(5%, -10%)'
    })
  }

  const textStyles: CSSObject = {
    ...(isSelected && {
      color: color.neutral.n950
    })
  }

  return (
    <Flex
      className='parent'
      alignItems='center'
      justifyContent='center'
      css={containerStyles}
      inline
      {...props}
    >
      {children}
      <Flex
        as='span'
        h={getDimension(size)}
        ph='xs'
        direction='column'
        justifyContent='center'
        alignItems='center'
        gap='s'
        borderRadius='circle'
        css={badgeStyles}
      >
        <Text
          variant='label'
          size='xs'
          css={textStyles}
          color='staticStaticWhite'
        >
          {count !== undefined ? formatCount(count) : ''}
        </Text>
      </Flex>
    </Flex>
  )
}
