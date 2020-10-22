import React, { useCallback } from 'react'
import Modal from 'components/Modal'
import Button, { ButtonType } from 'components/Button'
import styles from './ConnectMetaMaskModal.module.css'

const messages = {
  title: 'Connect MetaMask to Continue',
  description: 'Please sign in with MetaMask to continue',
  okayBtn: 'OKAY',
  openMetaMaskBtn: 'Open MetaMask'
}

type OwnProps = {
  isOpen: boolean
  onClose: () => void
}

type ConnectMetaMaskModalProps = OwnProps

const ConnectMetaMaskModal: React.FC<ConnectMetaMaskModalProps> = ({
  isOpen,
  onClose
}: ConnectMetaMaskModalProps) => {
  const onOpenMetaMask = useCallback(() => {
    // TODO: figure out how to do this....
  }, [])
  return (
    <Modal
      title={messages.title}
      className={styles.container}
      isOpen={isOpen}
      onClose={onClose}
      isCloseable={true}
    >
      <div className={styles.description}>{messages.description}</div>
      <div className={styles.btnContainer}>
        <Button
          text={messages.okayBtn}
          className={styles.okayBtn}
          type={ButtonType.PRIMARY_ALT}
          onClick={onClose}
        />
        <Button
          text={messages.openMetaMaskBtn}
          className={styles.openMetaMaskBtn}
          type={ButtonType.PRIMARY}
          onClick={onOpenMetaMask}
        />
      </div>
    </Modal>
  )
}

export default ConnectMetaMaskModal
