import { Flex, useTheme } from '@audius/harmony'

import { Text } from 'components/typography'
import { useIsMobile } from 'hooks/useIsMobile'

const messages = {
  earn: (amount: string) => `Earn ${amount} $AUDIO when you buy this track!`
}

type AudioMatchSectionProps = {
  amount: string
}

export const AudioMatchSection = ({ amount }: AudioMatchSectionProps) => {
  const isMobile = useIsMobile()
  const { color } = useTheme()
  return (
    <Flex
      ph='2xl'
      pv='s'
      mt={isMobile ? 'l' : undefined}
      justifyContent='center'
      alignItems='center'
      alignSelf='stretch'
      w='100%'
      css={{ backgroundColor: color.secondary.secondary }}
    >
      <Text
        variant='label'
        size={isMobile ? 'small' : 'large'}
        color='staticWhite'
      >
        {messages.earn(amount)}
      </Text>
    </Flex>
  )
}
