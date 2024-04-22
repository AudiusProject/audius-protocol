import { Nullable } from '@audius/common/utils'
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

export type DeleteConfirmationModalProps = {
  title: string
  customHeader?: Nullable<string>
  customDescription?: Nullable<string>
  visible: boolean
  entity: string
  onDelete: () => void
  onCancel: () => void
}

const DeleteConfirmationModal = (props: DeleteConfirmationModalProps) => {
  const header =
    props.customHeader == null
      ? `This ${props.entity} Will Disappear For Everyone`
      : props.customHeader
  const description =
    props.customDescription == null
      ? `Are you sure you want to delete this ${props.entity.toLowerCase()}?`
      : props.customDescription

  return (
    <Modal isOpen={props.visible} onClose={props.onCancel}>
      <ModalHeader>
        <ModalTitle title={props.title} />
      </ModalHeader>
      <ModalContent>
        <div css={{ textAlign: 'center' }}>
          <Text variant='title'>{header}</Text>
          <ModalContentText>{description}</ModalContentText>
        </div>
      </ModalContent>
      <ModalFooter>
        <Button
          variant='destructive'
          onClick={props.onDelete}
          fullWidth
        >{`Delete ${props.entity}`}</Button>
        <Button variant='secondary' onClick={props.onCancel} fullWidth>
          Nevermind
        </Button>
      </ModalFooter>
    </Modal>
  )
}

export default DeleteConfirmationModal
