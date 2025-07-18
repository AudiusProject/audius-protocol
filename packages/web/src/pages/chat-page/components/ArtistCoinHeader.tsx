import { useArtistCoinMessageHeader } from '@audius/common/hooks'
import { walletMessages } from '@audius/common/messages'
import { ID } from '@audius/common/models'
import { Flex, Text } from '@audius/harmony'
import { ChatBlastAudience } from '@audius/sdk'

import { TOKENS } from 'components/buy-sell-modal/constants'

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

  console.log('REED', { artistCoinSymbol })
  if (!artistCoinSymbol) return null

  const ArtistCoinIcon = TOKENS[artistCoinSymbol]?.icon
  console.log('REED', { ArtistCoinIcon, TOKENS })

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
