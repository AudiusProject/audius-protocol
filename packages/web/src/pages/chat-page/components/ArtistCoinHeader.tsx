import { useShouldShowArtistCoinMessageHeader } from '@audius/common/hooks'
import { ID } from '@audius/common/models'
import { Flex, IconTokenBonk, Text } from '@audius/harmony'
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
  const shouldShow = useShouldShowArtistCoinMessageHeader({ userId, audience })

  if (!shouldShow) return null

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
        <IconTokenBonk size='xs' />
        <Text variant='label' size='s'>
          $Bonk
        </Text>
      </Flex>
      <Text variant='label' size='s' color='accent'>
        {messages.membersOnly}
      </Text>
    </Flex>
  )
}
