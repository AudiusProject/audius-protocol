import { useTheme, CSSObject } from '@emotion/react'

import { Flex } from '../layout/Flex'
import { Text } from '../text/Text'

import type { BalancePillProps } from './types'

/**
 * A pill-shaped component that displays a balance, typically used to show a user's token balance.
 */
export const BalancePill = ({
  balance,
  children,
  ...props
}: BalancePillProps) => {
  const { color } = useTheme()

  const textStyles: CSSObject = {
    color: color.neutral.n950
  }

  return (
    <Flex
      pl='s'
      alignItems='center'
      gap='xs'
      borderRadius='circle'
      border='default'
      backgroundColor='surface1'
      {...props}
    >
      <Text
        variant='label'
        size='s'
        strength='strong'
        textAlign='center'
        css={textStyles}
      >
        {balance}
      </Text>
      <Flex h='unit6' p='unitHalf' justifyContent='center' alignItems='center'>
        {children}
      </Flex>
    </Flex>
  )
}
