import { useCallback } from 'react'

import { Button, ButtonProps, ButtonType, IconPencil } from '@audius/stems'
import cn from 'classnames'
import { useDispatch } from 'react-redux'

import { open as openEditCollectionModal } from 'store/application/ui/editPlaylistModal/slice'

import styles from './CollectionHeader.module.css'

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
    () => dispatch(openEditCollectionModal(collectionId)),
    [dispatch, collectionId]
  )

  return (
    <Button
      className={cn(styles.buttonFormatting)}
      textClassName={styles.buttonTextFormatting}
      type={ButtonType.COMMON}
      text={messages.edit}
      leftIcon={<IconPencil />}
      onClick={handleEdit}
      {...props}
    />
  )
}
