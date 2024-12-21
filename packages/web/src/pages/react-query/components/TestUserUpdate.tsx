import { useState } from 'react'

import { useUpdateUser, useUser } from '@audius/common/api'
import { Button, Flex, Text, TextInput } from '@audius/harmony'

type Props = {
  userId: string
}

export const TestUserUpdate = ({ userId }: Props) => {
  const { data: user } = useUser(userId)
  const updateUser = useUpdateUser()
  const [newBio, setNewBio] = useState('')

  const handleUpdateBio = () => {
    if (!user) return
    updateUser.mutate({
      userId,
      metadata: {
        bio: newBio
      }
    })
    // Clear input after submitting
    setNewBio('')
  }

  if (!user) return null

  return (
    <Flex direction='column' gap='m'>
      <Text variant='heading'>Update User: {user.name}</Text>
      <Text>Current Bio: {user.bio || 'No bio'}</Text>
      <Flex gap='m' alignItems='center'>
        <TextInput
          label='New bio'
          placeholder='Enter new bio'
          value={newBio}
          onChange={(e) => setNewBio(e.target.value)}
          disabled={updateUser.isPending}
        />
        <Button
          variant='primary'
          onClick={handleUpdateBio}
          isLoading={updateUser.isPending}
          disabled={!newBio.trim()}
        >
          Update Bio
        </Button>
      </Flex>
      {updateUser.isError && <Text>Error: {updateUser.error.message}</Text>}
      {updateUser.isSuccess && <Text>Successfully updated bio!</Text>}
    </Flex>
  )
}
