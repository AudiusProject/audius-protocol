import React from 'react'
import { ButtonType } from '@audius/stems'

import Modal from 'components/Modal'
import Button from 'components/Button'
import styles from './AudioRewardsModal.module.css'
import apiLogo from 'assets/img/apiLogo.png'

const messages = {
  title: '$AUDIO REWARDS',
  apiLogo: 'Audius API Logo',
  header: 'It’s easy to build your own app on Audius',
  description1: 'The top 10 Audius API apps each month win.',
  description2: 'See your app on the leaderboard? Email api@audius.co',
  btn: 'LEARN MORE ABOUT USING THE API'
}

type OwnProps = {
  isOpen: boolean
  onClose: () => void
}

type AudioRewardsModalProps = OwnProps

const AudioRewardsModal: React.FC<AudioRewardsModalProps> = ({
  isOpen,
  onClose
}: AudioRewardsModalProps) => {
  return (
    <Modal
      title={messages.title}
      isOpen={isOpen}
      onClose={onClose}
      isCloseable={true}
      dismissOnClickOutside={true}
    >
      <img className={styles.apiLogo} src={apiLogo} alt={messages.apiLogo} />
      <h6 className={styles.header}>{messages.header}</h6>
      <p className={styles.description}>{messages.description1}</p>
      <p className={styles.description}>{messages.description2}</p>
      <Button
        text={messages.btn}
        className={styles.btn}
        type={ButtonType.PRIMARY}
        onClick={onClose}
      />
    </Modal>
  )
}

export default AudioRewardsModal
