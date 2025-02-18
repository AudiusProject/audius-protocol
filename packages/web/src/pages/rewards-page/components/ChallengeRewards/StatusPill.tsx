import {
  BoxProps,
  Flex,
  IconSparkles,
  Text,
  TextProps,
  useTheme
} from '@audius/harmony'

import { messages } from '../../messages'

type BasePillProps = {
  children: React.ReactNode
  color: TextProps['color']
  borderColor?: string
} & Pick<BoxProps, 'backgroundColor' | 'border'>

const BasePill = ({
  children,
  color,
  borderColor,
  backgroundColor
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
      backgroundColor={backgroundColor}
      css={{
        border: borderColor ? `1px solid ${borderColor}` : undefined
      }}
    >
      {isSimpleText ? (
        <Text variant='body' size='m' strength='strong' color={color}>
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
        color='white'
        backgroundColor='primary'
        borderColor={color.primary.p400}
      >
        {messages.readyToClaim}
      </BasePill>
    )
  }

  if (shouldShowNewChallengePill) {
    return (
      <BasePill
        color='accent'
        backgroundColor='surface2'
        borderColor={color.border.strong}
      >
        <Flex alignItems='center' justifyContent='center' gap='xs'>
          <IconSparkles size='s' color='accent' />
          <Text variant='body' size='m' strength='strong' color='accent'>
            {messages.new}
          </Text>
        </Flex>
      </BasePill>
    )
  }

  return null
}
