import { TextProps, useTheme, Text } from '@audius/harmony'

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
  const { spacing } = useTheme()
  return (
    <Text
      variant='label'
      size='s'
      color={color}
      css={{
        padding: `${spacing.unit1}px ${spacing.unit2}px`,
        borderRadius: spacing.unit3,
        backgroundColor,
        border: borderColor ? `1px solid ${borderColor}` : undefined
      }}
    >
      {children}
    </Text>
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
