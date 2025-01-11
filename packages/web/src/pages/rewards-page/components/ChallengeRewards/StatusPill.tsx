import {
  Flex,
  IconSpecialAccess,
  Text,
  TextProps,
  useTheme
} from '@audius/harmony'

import { messages } from '../../messages'

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
  const isSimpleText = typeof children === 'string'
  return (
    <Flex
      alignItems='center'
      justifyContent='center'
      pv='xs'
      h='xl'
      ph='s'
      borderRadius='l'
      css={{
        backgroundColor,
        border: borderColor ? `1px solid ${borderColor}` : undefined
      }}
    >
      {isSimpleText ? (
        <Text variant='label' size='s' color={color}>
          {children}
        </Text>
      ) : (
        children
      )}
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
        <Flex alignItems='center' justifyContent='center' gap='xs'>
          <IconSpecialAccess size='s' color='staticWhite' />
          <Text variant='label' size='s' color='staticWhite'>
            {messages.new}
          </Text>
        </Flex>
      </BasePill>
    )
  }

  return null
}
