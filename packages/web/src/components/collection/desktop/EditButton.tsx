import { useCallback } from 'react'

import { ButtonProps, ButtonType, IconPencil } from '@audius/stems'
import { useDispatch } from 'react-redux'

import { open as openEditCollectionModal } from 'store/application/ui/editPlaylistModal/slice'

import { CollectionActionButton } from './CollectionActionButton'

const messages = {
  edit: 'Edit'
}

type EditButtonProps = Partial<ButtonProps> & {
  collectionId: number
}

export const EditButton = (props: EditButtonProps) => {
  const { collectionId } = props
  const dispatch = useDispatch()

  const handleEdit = useCallback(
    () => dispatch(openEditCollectionModal({ collectionId })),
    [dispatch, collectionId]
  )

  return (
    <CollectionActionButton
      type={ButtonType.COMMON}
      text={messages.edit}
      leftIcon={<IconPencil />}
      onClick={handleEdit}
      {...props}
    />
  )
}
