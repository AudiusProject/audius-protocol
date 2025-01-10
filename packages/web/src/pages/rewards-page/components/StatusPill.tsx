import { Flex, Text, TextProps, useTheme } from '@audius/harmony'

import { messages } from '../messages'

type BasePillProps = {
  children: React.ReactNode
  color: TextProps['color']
  backgroundColor?: string
  borderColor?: string
}

const BasePill = ({
  children,
  color,
  backgroundColor,
  borderColor
}: BasePillProps) => {
  return (
    <Flex
      alignItems='center'
      justifyContent='center'
      pv='xs'
      ph='s'
      borderRadius='m'
      css={{
        backgroundColor,
        border: borderColor ? `1px solid ${borderColor}` : undefined
      }}
    >
      <Text variant='label' size='s' color={color}>
        {children}
      </Text>
    </Flex>
  )
}

type StatusPillProps = {
  shouldShowClaimPill: boolean
  shouldShowNewChallengePill: boolean
}

export const StatusPill = ({
  shouldShowClaimPill,
  shouldShowNewChallengePill
}: StatusPillProps) => {
  const { color } = useTheme()

  if (shouldShowClaimPill) {
    return (
      <BasePill
        color='accent'
        backgroundColor={color.background.surface1}
        borderColor={color.border.strong}
      >
        {messages.readyToClaim}
      </BasePill>
    )
  }

  if (shouldShowNewChallengePill) {
    return (
      <BasePill
        color='staticWhite'
        backgroundColor={color.background.primary}
        borderColor={color.primary.p400}
      >
        {messages.new}
      </BasePill>
    )
  }

  return null
}
