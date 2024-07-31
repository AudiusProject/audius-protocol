import {
  Button,
  IconRocket,
  Modal,
  ModalContent,
  ModalContentText,
  ModalFooter,
  ModalHeader,
  ModalProps,
  ModalTitle
} from '@audius/harmony'

const messages = {
  title: {
    hidden: 'Confirm Update',
    release: 'Confirm Release',
    early_release: 'Confirm Early Release'
  },
  description: {
    hidden: () =>
      `You're about to change your content from public to hidden. It will be hidden from the public and your followers will lose access.`,
    release: (collectionType: string) =>
      `Are you sure you want to release this ${collectionType}? Your followers will be notified.`,
    early_release: (collectionType: string) =>
      `Do you want to release your ${collectionType} now? All scheduled tracks will become public, and your followers will be notified.`
  },
  goBack: 'Cancel',
  confirm: {
    hidden: 'Make Hidden',
    release: 'Release Now',
    early_release: 'Release Now'
  }
}

type Props = Omit<ModalProps, 'children'> & {
  formId: string
  collectionType: 'playlist' | 'album'
  releaseType: 'release' | 'early_release' | 'hidden'
}

export const ReleaseCollectionConfirmationModal = (props: Props) => {
  const { formId, collectionType, releaseType, ...other } = props
  const { onClose } = other
  return (
    <Modal {...other} size='small'>
      <ModalHeader>
        <ModalTitle icon={<IconRocket />} title={messages.title[releaseType]} />
      </ModalHeader>
      <ModalContent>
        <ModalContentText css={{ textAlign: 'center' }}>
          {messages.description[releaseType](collectionType)}
        </ModalContentText>
      </ModalContent>
      <ModalFooter>
        <Button variant='secondary' onClick={onClose} fullWidth>
          {messages.goBack}
        </Button>
        <Button variant='primary' type='submit' form={formId} fullWidth>
          {messages.confirm[releaseType]}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
