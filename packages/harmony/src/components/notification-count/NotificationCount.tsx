import { useTheme, CSSObject } from '@emotion/react'
import numeral from 'numeral'

import { Flex } from '../layout/Flex'
import { Text } from '../text/Text'

import type { NotificationCountProps } from './types'

/**
 * Formats a count into a more readable string representation.
 * For counts over 1000, it converts the number into a format with a suffix (K for thousands, M for millions, etc.)
 * For example:
 * - 375 => "375"
 * - 4,210 => "4.21K"
 * - 443,123 => "443K"
 * - 4,001,000 => "4M"
 * If the count is 0, it returns "0".
 * This function is pulled over from the common package because we don't use the common package in Harmony.
 */
export const formatCount = (count: number) => {
  if (count >= 1000) {
    const countStr = count.toString()
    if (countStr.length % 3 === 0) {
      return numeral(count).format('0a').toUpperCase()
    } else if (countStr.length % 3 === 1 && countStr[2] !== '0') {
      return numeral(count).format('0.00a').toUpperCase()
    } else if (countStr.length % 3 === 1 && countStr[1] !== '0') {
      return numeral(count).format('0.0a').toUpperCase()
    } else if (countStr.length % 3 === 2 && countStr[2] !== '0') {
      return numeral(count).format('0.0a').toUpperCase()
    } else {
      return numeral(count).format('0a').toUpperCase()
    }
  } else if (!count) {
    return '0'
  } else {
    return `${count}`
  }
}

/**
 * A small badge that displays a notification count and can wrap an icon, typically used with icons or buttons
 * to indicate unread or pending notifications.
 */
export const NotificationCount = ({
  count,
  size,
  children,
  ...props
}: NotificationCountProps) => {
  const { spacing, color } = useTheme()

  const containerStyles: CSSObject = {
    display: 'inline-flex',
    position: 'relative'
  }

  const badgeStyles: CSSObject = {
    position: 'absolute',
    top: 0,
    right: 0,
    transform: 'translate(50%, -50%)',
    minWidth: spacing.unit5,
    backgroundColor: color.primary.p300,
    border: 'none',
    '.parent:hover &': {
      backgroundColor: color.background.surface1
    },
    ...(size === 's' && {
      height: spacing.unit3 + spacing.unitHalf,
      minWidth: spacing.unit3 + spacing.unitHalf,
      padding: `0px ${spacing.xs}px`,
      backgroundColor: color.primary.p300
    })
  }

  const textStyles: CSSObject = {
    '.parent:hover &': {
      color: color.neutral.n950
    }
  }

  return (
    <Flex
      className='parent'
      alignItems='center'
      justifyContent='center'
      css={containerStyles}
      {...props}
    >
      {children}
      <Flex
        as='span'
        h='unit5'
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
          {count !== undefined ? formatCount(count) : '0'}
        </Text>
      </Flex>
    </Flex>
  )
}
