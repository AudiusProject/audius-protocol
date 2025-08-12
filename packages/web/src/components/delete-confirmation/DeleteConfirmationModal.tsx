import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  Button,
  ModalFooter,
  ModalContentText,
  Text
} from '@audius/harmony'

const messages = {
  description: (entity: string) =>
    `Are you sure you want to delete this ${entity.toLowerCase()}?`,
  cancel: 'Cancel',
  delete: (entity: string) => `Delete ${entity}`,
  deleting: `Deleting`
}

export type DeleteConfirmationModalProps = {
  title: string
  header?: string
  description?: string
  visible: boolean
  entity: string
  onDelete: () => void
  onCancel: () => void
  isDeleting?: boolean
}

const DeleteConfirmationModal = (props: DeleteConfirmationModalProps) => {
  const {
    title,
    header,
    entity,
    description = messages.description(entity),
    visible,
    onDelete,
    onCancel,
    isDeleting = false
  } = props

  return (
    <Modal isOpen={visible} onClose={onCancel} size='small'>
      <ModalHeader>
        <ModalTitle title={title} />
      </ModalHeader>
      <ModalContent>
        <div css={{ textAlign: 'center' }}>
          {header ? <Text variant='title'>{header}</Text> : null}
          <ModalContentText>{description}</ModalContentText>
        </div>
      </ModalContent>
      <ModalFooter>
        <Button
          variant='secondary'
          onClick={onCancel}
          fullWidth
          disabled={isDeleting}
        >
          {messages.cancel}
        </Button>
        <Button
          variant='destructive'
          onClick={onDelete}
          fullWidth
          isLoading={isDeleting}
        >
          {isDeleting ? messages.deleting : messages.delete(entity)}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

export default DeleteConfirmationModal
