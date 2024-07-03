import {
  Button,
  Modal,
  ModalContent,
  ModalContentText,
  ModalFooter,
  ModalHeader,
  ModalProps,
  ModalTitle
} from '@audius/harmony'

const messages = {
  title: 'Confirm Release',
  description:
    'Are you sure you want to release this playlist? All hidden tracks will go public, and your followers will be notified.',
  goBack: 'Go Back',
  release: 'Release My Playlist'
}

type Props = Omit<ModalProps, 'children'> & {
  formId: string
}

export const ReleaseCollectionConfirmationModal = (props: Props) => {
  const { formId, ...other } = props
  const { onClose } = other
  return (
    <Modal {...other} size='small'>
      <ModalHeader>
        <ModalTitle title={messages.title} />
      </ModalHeader>
      <ModalContent>
        <ModalContentText css={{ textAlign: 'center' }}>
          {messages.description}
        </ModalContentText>
      </ModalContent>
      <ModalFooter>
        <Button variant='secondary' onClick={onClose} fullWidth>
          {messages.goBack}
        </Button>
        <Button variant='primary' type='submit' form={formId} fullWidth>
          {messages.release}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
