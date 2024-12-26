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
