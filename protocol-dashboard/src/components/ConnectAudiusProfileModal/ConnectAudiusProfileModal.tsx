import Modal from 'components/Modal'
import { useConnectAudiusProfile } from 'hooks/useConnectAudiusProfile'
import Button, { ButtonType } from 'components/Button'
import styles from './ConnectAudiusProfileModal.module.css'

const messages = {
  connectAudiusProfileTitle: 'Connect Audius Profile',
  connectAudiusProfileDescriptionP1:
    'Help other users identify you by connecting your Audius account.',
  connectAudiusProfileDescriptionP2:
    'Once you’ve linked your Audius account, your Profile Picture and Display Name will be visible to users throughout the protocol dashboard.',
  connectProfileButton: 'Connect Profile'
}
type ConnectAudiusProfileModalProps = {
  isOpen: boolean
  onClose: () => void
  wallet: string
}

export const ConnectAudiusProfileModal = ({
  isOpen,
  onClose,
  wallet
}: ConnectAudiusProfileModalProps) => {
  const connectAudiusProfile = useConnectAudiusProfile(wallet)
  return (
    <Modal
      title={messages.connectAudiusProfileTitle}
      isOpen={isOpen}
      onClose={onClose}
      isCloseable
      dismissOnClickOutside
    >
      <div className={styles.innerModalWrapper}>
        <div className={styles.content}>
          <div className={styles.description}>
            <span className={styles.boldDescription}>
              {messages.connectAudiusProfileDescriptionP1}
            </span>
            <span>{messages.connectAudiusProfileDescriptionP2}</span>
          </div>
        </div>
        <Button
          onClick={connectAudiusProfile}
          type={ButtonType.PRIMARY}
          text={messages.connectProfileButton}
          className={styles.button}
        />
      </div>
    </Modal>
  )
}
