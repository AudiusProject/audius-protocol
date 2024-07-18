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
    hidden: `Are you sure you want to make this track public? Your followers will be notified.`,
    scheduled: `Do you want to release your track now? Your followers will be notified.`
  },
  goBack: 'Go Back',
  release: `Release Now`
}

type Props = Omit<ModalProps, 'children'> & {
  formId: string
  releaseType: 'hidden' | 'scheduled'
}

export const ReleaseTrackConfirmationModal = (props: Props) => {
  const { formId, releaseType, ...other } = props
  const { onClose } = other
  return (
    <Modal {...other} size='small'>
      <ModalHeader>
        <ModalTitle icon={<IconRocket />} title={messages.title[releaseType]} />
      </ModalHeader>
      <ModalContent>
        <ModalContentText css={{ textAlign: 'center' }}>
          {messages.description[releaseType]}
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
