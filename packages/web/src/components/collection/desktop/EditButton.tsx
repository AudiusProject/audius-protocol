import { useCallback } from 'react'

import { useGetCurrentUserId, useGetPlaylistById } from '@audius/common/api'
import { useEditPlaylistModal } from '@audius/common/store'
import { IconPencil, IconButton, IconButtonProps } from '@audius/harmony'
import { capitalize } from 'lodash'

import { Tooltip } from 'components/tooltip'

const messages = {
  edit: (type?: 'album' | 'playlist') => `Edit ${capitalize(type) ?? ''}`
}

type EditButtonProps = Partial<IconButtonProps> & {
  collectionId: number
}

export const EditButton = (props: EditButtonProps) => {
  const { collectionId, ...other } = props
  const { data: currentUserId } = useGetCurrentUserId({})
  const { data: collection } = useGetPlaylistById({
    playlistId: collectionId,
    currentUserId
  })
  const collectionType = collection
    ? collection?.is_album
      ? 'album'
      : 'playlist'
    : undefined

  const { onOpen } = useEditPlaylistModal()

  const handleEdit = useCallback(() => {
    onOpen({ collectionId, isCollectionViewed: true })
  }, [collectionId, onOpen])

  return (
    <Tooltip text={messages.edit(collectionType)}>
      <IconButton
        icon={IconPencil}
        onClick={handleEdit}
        aria-label='Edit Collection'
        color='subdued'
        {...other}
      />
    </Tooltip>
  )
}
