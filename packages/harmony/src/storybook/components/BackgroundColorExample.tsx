import { useTheme } from '@emotion/react'

import { Flex, Text } from '~harmony/components'
import { IconTokenSilver, IconVerified } from '~harmony/icons'

export function BackgroundColorExample() {
  const theme = useTheme()
  const { color, cornerRadius, spacing, shadows } = theme

  return (
    <Flex
      flex={1}
      p='2xl'
      css={{
        background: color.background.default,
        border: `1px solid ${color.border.strong}`,
        borderRadius: cornerRadius.m
      }}
    >
      <Flex
        flex={1}
        alignItems='center'
        justifyContent='center'
        css={{
          height: spacing.unit20,
          background: color.background.white,
          boxShadow: shadows.mid,
          borderRadius: cornerRadius.m
        }}
      >
        <Text color='default'>
          Display Name <IconVerified size='xs' /> <IconTokenSilver size='xs' />
        </Text>
      </Flex>
    </Flex>
  )
}
