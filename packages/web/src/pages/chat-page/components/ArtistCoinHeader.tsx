import { useArtistCoinMessageHeader } from '@audius/common/hooks'
import { walletMessages } from '@audius/common/messages'
import { ID } from '@audius/common/models'
import { useTokens } from '@audius/common/store'
import { Flex, Text } from '@audius/harmony'
import { ChatBlastAudience } from '@audius/sdk'

const messages = {
  membersOnly: 'Members Only'
}

export const ArtistCoinHeader = ({
  userId,
  audience
}: {
  userId: ID
  audience?: ChatBlastAudience
}) => {
  const artistCoinSymbol = useArtistCoinMessageHeader({
    userId,
    audience
  })

  const { tokens, isLoading } = useTokens()

  if (!artistCoinSymbol) return null

  const ArtistCoinIcon = !isLoading ? tokens[artistCoinSymbol]?.icon : undefined

  return (
    <Flex
      ph='l'
      pv='xs'
      gap='m'
      justifyContent='space-between'
      alignItems='center'
      backgroundColor='surface1'
      borderBottom='default'
    >
      <Flex gap='xs' alignItems='center'>
        {ArtistCoinIcon ? <ArtistCoinIcon size='xs' /> : null}
        <Text variant='label' size='s'>
          {walletMessages.dollarSign}
          {artistCoinSymbol}
        </Text>
      </Flex>
      <Text variant='label' size='s' color='accent'>
        {messages.membersOnly}
      </Text>
    </Flex>
  )
}
