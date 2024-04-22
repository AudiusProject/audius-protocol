import { Button, Modal } from '@audius/harmony'

import LoadingSpinnerFullPage from 'components/loading-spinner-full-page/LoadingSpinnerFullPage'

import { messages } from '../../DeactivateAccountPage'

import styles from './DeactivateAccountConfirmationModal.module.css'

type DeactivateAccountModalProps = {
  isLoading: boolean
  isVisible: boolean
  onClose: () => void
  onConfirm: () => void
}

export const DeactivateAccountConfirmationModal = ({
  isLoading,
  isVisible,
  onClose,
  onConfirm
}: DeactivateAccountModalProps) => {
  return (
    <Modal
      bodyClassName={styles.confirmModal}
      isOpen={isVisible}
      onClose={onClose}
      showDismissButton
      showTitleHeader
      title={messages.confirmTitle}
    >
      <div className={styles.container}>
        {isLoading ? (
          <LoadingSpinnerFullPage />
        ) : (
          <div className={styles.confirmText}>{messages.confirm}</div>
        )}
        <div className={styles.buttons}>
          <Button
            variant='destructive'
            isLoading={isLoading}
            onClick={onConfirm}
          >
            {messages.buttonDeactivate}
          </Button>
          <Button isLoading={isLoading} onClick={onClose}>
            {messages.buttonGoBack}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
