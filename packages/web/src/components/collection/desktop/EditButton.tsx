import { useCallback } from 'react'

import { useEditPlaylistModal } from '@audius/common/store'
import { IconPencil, IconButton, IconButtonProps } from '@audius/harmony'

type EditButtonProps = Partial<IconButtonProps> & {
  collectionId: number
}

export const EditButton = (props: EditButtonProps) => {
  const { collectionId, ...other } = props

  const { onOpen } = useEditPlaylistModal()

  const handleEdit = useCallback(() => {
    onOpen({ collectionId, isCollectionViewed: true })
  }, [collectionId, onOpen])

  return (
    <IconButton
      icon={IconPencil}
      onClick={handleEdit}
      aria-label='Edit Collection'
      color='subdued'
      {...other}
    />
  )
}
