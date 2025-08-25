import { useArtistCoinMessageHeader } from '@audius/common/hooks'
import { Image, Platform } from 'react-native'
import type { ID } from '@audius/common/models'
import type { ChatBlastAudience } from '@audius/sdk'

import { Flex, HexagonalIcon, spacing, Text } from '@audius/harmony-native'
import { useTokens } from '@audius/common/store'

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

  const ArtistCoinIcon = !isLoading ? (
    <HexagonalIcon size={spacing.m}>
      <Image
        source={{ uri: tokens[artistCoinSymbol]?.logoURI }}
        style={{
          width: spacing.m,
          height: spacing.m
        }}
      />
    </HexagonalIcon>
  ) : undefined

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
        {ArtistCoinIcon}
        {/* Alignment bug for label text variant on iOS */}
        <Flex mt={Platform.OS === 'ios' ? '2xs' : 'none'}>
          <Text variant='label' size='s'>
            {artistCoinSymbol}
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
