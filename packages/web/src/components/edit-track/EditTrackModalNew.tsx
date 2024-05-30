import { useEditTrackModal } from '@audius/common/store'
import { Modal, ModalHeader, ModalTitle } from '@audius/harmony'

const messages = {
  helloWorld: 'Hello World'
}

export const EditTrackModalNew = () => {
  const { isOpen, onClose } = useEditTrackModal()

  return (
    <Modal isOpen={isOpen} onClose={onClose} size='large'>
      <ModalHeader>
        <ModalTitle title={messages.helloWorld} />
      </ModalHeader>
    </Modal>
  )
}
