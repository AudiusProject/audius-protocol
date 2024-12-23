import { useState } from 'react'

import { useTrack, useUpdateTrack } from '@audius/common/api'
import { ID } from '@audius/common/models'
import { Button, Flex, Text, TextInput } from '@audius/harmony'

type Props = {
  trackId: ID
}

export const TestTrackUpdate = ({ trackId }: Props) => {
  const { data: track } = useTrack(trackId)
  const updateTrack = useUpdateTrack()
  const [newTitle, setNewTitle] = useState('')

  const handleUpdateTitle = () => {
    if (!track) return
    updateTrack.mutate({
      trackId,
      metadata: {
        title: newTitle
      },
      userId: track.user.user_id
    })
    // Clear input after submitting
    setNewTitle('')
  }

  if (!track) return null

  return (
    <Flex direction='column' gap='m'>
      <Text variant='heading'>Update Track: {track.title}</Text>
      <Text>Current Title: {track.title}</Text>
      <Flex gap='m' alignItems='center'>
        <TextInput
          label='New title'
          placeholder='Enter new title'
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          disabled={updateTrack.isPending}
        />
        <Button
          variant='primary'
          onClick={handleUpdateTitle}
          isLoading={updateTrack.isPending}
          disabled={!newTitle.trim()}
        >
          Update Title
        </Button>
      </Flex>
      {updateTrack.isError && <Text>Error: {updateTrack.error.message}</Text>}
      {updateTrack.isSuccess && <Text>Successfully updated title!</Text>}
    </Flex>
  )
}
