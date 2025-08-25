import { useArtistCoinMessageHeader } from '@audius/common/hooks'
import { ID } from '@audius/common/models'
import { useTokens } from '@audius/common/store'
import { Artwork, Flex, spacing, Text } from '@audius/harmony'
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

  const artistCoinLogo = !isLoading ? (
    <Artwork
      src={tokens[artistCoinSymbol]?.logoURI}
      hex
      w={spacing.m}
      h={spacing.m}
      borderWidth={0}
    />
  ) : undefined

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
        {artistCoinLogo}
        <Text variant='label' size='s'>
          {artistCoinSymbol}
        </Text>
      </Flex>
      <Text variant='label' size='s' color='accent'>
        {messages.membersOnly}
      </Text>
    </Flex>
  )
}
