import React, { useCallback } from 'react'

import { ButtonType } from '@audius/stems'

import apiLogo from 'assets/img/apiLogo.png'
import Button from 'components/Button'
import Modal from 'components/Modal'
import useOpenLink from 'hooks/useOpenLink'
import { AUDIUS_API_URL } from 'utils/routes'

import styles from './AudioRewardsModal.module.css'

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
  const openLink = useOpenLink(AUDIUS_API_URL)
  const onClickBtn = useCallback(
    (e: React.MouseEvent) => {
      openLink(e)
      onClose()
    },
    [openLink, onClose]
  )
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
        onClick={onClickBtn}
      />
    </Modal>
  )
}

export default AudioRewardsModal
