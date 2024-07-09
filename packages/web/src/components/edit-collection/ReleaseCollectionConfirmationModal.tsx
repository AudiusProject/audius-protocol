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
    hidden: 'Confirm Release',
    scheduled: 'Confirm Early Release'
  },
  description: {
    hidden: (collectionType: string) =>
      `Are you sure you want to release this ${collectionType}? All hidden tracks will go public, and your followers will be notified.`,
    scheduled: (collectionType: string) =>
      `Do you want to release your ${collectionType} now? All scheduled tracks will become public, and your followers will be notified.`
  },
  goBack: 'Go Back',
  release: (collectionType: string) => `Release My ${collectionType}`
}

type Props = Omit<ModalProps, 'children'> & {
  formId: string
  collectionType: 'playlist' | 'album'
  releaseType: 'hidden' | 'scheduled'
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
          {messages.release(collectionType)}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
