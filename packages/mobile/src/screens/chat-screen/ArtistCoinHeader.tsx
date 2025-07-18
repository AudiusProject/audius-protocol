import { useArtistCoinMessageHeader } from '@audius/common/hooks'
import { walletMessages } from '@audius/common/messages'
import type { ID } from '@audius/common/models'
import type { ChatBlastAudience } from '@audius/sdk'
import { Platform } from 'react-native'

import { Flex, IconTokenBonk, Text } from '@audius/harmony-native'

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
  const { shouldShowArtistCoinHeader, artistCoinTicker } =
    useArtistCoinMessageHeader({
      userId,
      audience
    })

  if (!shouldShowArtistCoinHeader) return null

  return (
    <Flex
      row
      ph='l'
      pv='xs'
      gap='m'
      alignItems='center'
      justifyContent='space-between'
      backgroundColor='surface1'
      borderBottom='default'
    >
      <Flex row gap='xs' alignItems='center'>
        <IconTokenBonk size='xs' />
        {/* Alignment bug for label text variant on iOS */}
        <Flex mt={Platform.OS === 'ios' ? '2xs' : 'none'}>
          <Text variant='label' size='s'>
            {walletMessages.dollarSign}
            {artistCoinTicker}
          </Text>
        </Flex>
      </Flex>
      <Flex mt={Platform.OS === 'ios' ? '2xs' : 'none'}>
        <Text variant='label' size='s' color='accent'>
          {messages.membersOnly}
        </Text>
      </Flex>
    </Flex>
  )
}
