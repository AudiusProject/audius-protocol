import { useUser } from '@audius/common/api'
import { ID } from '@audius/common/models'
import { Flex, Text } from '@audius/harmony'

type Props = {
  userId: ID
}

export const TestUser = ({ userId }: Props) => {
  const { data: user, isLoading, error } = useUser(userId, { staleTime: 10000 })

  if (isLoading) return <Text>Loading...</Text>
  if (error) return <Text>Error loading user: {error.message}</Text>
  if (!user) return null

  return (
    <Flex direction='column' gap='m'>
      <Text variant='heading'>{user.name}</Text>
      <Text>{user.bio || 'No description'}</Text>
      <Text>By: {user.name}</Text>
      <Text>ID: {user.id}</Text>
    </Flex>
  )
}
