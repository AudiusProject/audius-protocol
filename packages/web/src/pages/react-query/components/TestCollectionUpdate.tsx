import { useState } from 'react'

import { useCollection, useUpdateCollection } from '@audius/common/api'
import { ID } from '@audius/common/models'
import { EditCollectionValues } from '@audius/common/store'
import { Button, Flex, Text, TextInput } from '@audius/harmony'

type Props = {
  playlistId: ID
}

export const TestCollectionUpdate = ({ playlistId }: Props) => {
  const { data: collection } = useCollection(playlistId)
  const updateCollection = useUpdateCollection()
  const [newTitle, setNewTitle] = useState('')

  const handleUpdateTitle = () => {
    if (!collection) return
    updateCollection.mutate({
      collectionId: playlistId,
      metadata: {
        playlist_name: newTitle
      } as EditCollectionValues
    })
    // Clear input after submitting
    setNewTitle('')
  }

  if (!collection) return null

  return (
    <Flex direction='column' gap='m'>
      <Text variant='heading'>
        Update Collection: {collection.playlist_name}
      </Text>
      <Text>Current Title: {collection.playlist_name}</Text>
      <Flex gap='m' alignItems='center'>
        <TextInput
          label='New title'
          placeholder='Enter new title'
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          disabled={updateCollection.isPending}
        />
        <Button
          variant='primary'
          onClick={handleUpdateTitle}
          isLoading={updateCollection.isPending}
          disabled={!newTitle.trim()}
        >
          Update Title
        </Button>
      </Flex>
      {updateCollection.isError && (
        <Text>Error: {updateCollection.error.message}</Text>
      )}
      {updateCollection.isSuccess && <Text>Successfully updated title!</Text>}
    </Flex>
  )
}
