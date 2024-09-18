import { ReactNode } from 'react'

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

const defaultMessages = {
  cancel: 'Cancel',
  confirm: 'Confirm'
}

type ConfirmationModalProps = Omit<ModalProps, 'children'> & {
  messages: {
    header: string | undefined
    description: string | ReactNode | undefined
    confirm?: string
    cancel?: string
  }
  onCancel?: () => void
  onConfirm?: () => void
  cancelButtonText?: string
  confirmButtonText?: string
  destructive?: boolean
}

export const ConfirmationModal = (props: ConfirmationModalProps) => {
  const {
    messages: messagesProp,
    onCancel,
    onConfirm,
    destructive,
    ...other
  } = props

  const messages = { ...defaultMessages, ...messagesProp }

  const { onClose } = other

  return (
    <Modal {...other} size='small'>
      <ModalHeader>
        <ModalTitle title={messages.header} />
      </ModalHeader>
      <ModalContent>
        <ModalContentText css={{ textAlign: 'center' }}>
          {messages.description}
        </ModalContentText>
      </ModalContent>
      <ModalFooter>
        <Button
          variant='secondary'
          onClick={() => {
            onCancel?.()
            onClose?.()
          }}
          fullWidth
        >
          {messages.cancel}
        </Button>
        <Button
          variant={destructive ? 'destructive' : 'primary'}
          onClick={() => {
            onConfirm?.()
            onClose?.()
          }}
          fullWidth
        >
          {messages.confirm}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
