import { useCallback } from 'react'

import { useEditPlaylistModal } from '@audius/common/store'
import { ButtonProps, IconPencil, Button } from '@audius/harmony'

const messages = {
  edit: 'Edit'
}

type EditButtonProps = Partial<ButtonProps> & {
  collectionId: number
}

export const EditButton = (props: EditButtonProps) => {
  const { collectionId, ...other } = props

  const { onOpen } = useEditPlaylistModal()

  const handleEdit = useCallback(() => {
    onOpen({ collectionId, isCollectionViewed: true })
  }, [collectionId, onOpen])

  return (
    <Button
      variant='secondary'
      iconLeft={IconPencil}
      onClick={handleEdit}
      {...other}
    >
      {messages.edit}
    </Button>
  )
}
