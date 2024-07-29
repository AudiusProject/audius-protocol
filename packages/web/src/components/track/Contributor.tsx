import { useGetUserById } from '@audius/common/api'
import { User } from '@audius/common/models'
import { accountSelectors } from '@audius/common/store'
import { Flex, Text } from '@audius/harmony'
import { useSelector } from 'react-redux'

import ArtistChip from 'components/artist/ArtistChip'

export const Contributor = ({
  userId,
  amount
}: {
  userId: number
  amount: number
}) => {
  const currentUserId = useSelector(accountSelectors.getUserId)
  const { data: user } = useGetUserById({ id: userId, currentUserId })
  if (!user) {
    return null
  }
  return (
    <Flex alignItems='center' gap='s' flex='1'>
      <ArtistChip user={user as User} />
      <Text strength='strong' size='l' color='accent'>
        {amount} $AUDIO
      </Text>
    </Flex>
  )
}
