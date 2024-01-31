import { useCallback } from 'react'

import { useEditPlaylistModal } from '@audius/common/store'

import { ButtonProps, ButtonType, IconPencil } from '@audius/stems'

import { EntityActionButton } from '../../entity-page/EntityActionButton'

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
    <EntityActionButton
      type={ButtonType.COMMON}
      text={messages.edit}
      leftIcon={<IconPencil />}
      onClick={handleEdit}
      {...other}
    />
  )
}
