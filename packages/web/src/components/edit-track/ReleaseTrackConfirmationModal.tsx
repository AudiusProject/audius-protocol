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
    release: 'Confirm Release',
    early_release: 'Confirm Early Release',
    hidden: 'Confirm Update'
  },
  description: {
    release: `Are you sure you want to make this track public? Your followers will be notified.`,
    early_release: `Do you want to release your track now? Your followers will be notified.`,
    hidden:
      "You're about to change your content from public to hidden. It will be hidden from the public and your followers will lose access."
  },
  goBack: 'Go Back',
  release: `Release Now`,
  makeHidden: `Make Hidden`
}

type Props = Omit<ModalProps, 'children'> & {
  formId: string
  releaseType: 'release' | 'early_release' | 'hidden'
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
          {releaseType === 'hidden' ? messages.makeHidden : messages.release}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
