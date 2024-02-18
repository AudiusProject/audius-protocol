import { Modal } from '@audius/harmony'
import { Button, ButtonType } from '@audius/stems'
import cn from 'classnames'

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
            className={cn(styles.button, {
              [styles.buttonDanger]: !isLoading
            })}
            isDisabled={isLoading}
            onClick={onConfirm}
            textClassName={styles.deleteButtonText}
            text={messages.buttonDeactivate}
            type={isLoading ? ButtonType.DISABLED : ButtonType.PRIMARY_ALT}
          />
          <Button
            className={styles.button}
            isDisabled={isLoading}
            onClick={onClose}
            text={messages.buttonGoBack}
            type={isLoading ? ButtonType.DISABLED : ButtonType.PRIMARY_ALT}
          />
        </div>
      </div>
    </Modal>
  )
}
