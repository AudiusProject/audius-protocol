import { useCallback } from 'react'

import { ChatPermission } from '@audius/sdk'
import {
  Button,
  IconMessage,
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  RadioButtonGroup
} from '@audius/stems'

import { useModalState } from 'common/hooks/useModalState'

import { ModalRadioItem } from '../modal-radio/ModalRadioItem'

import styles from './InboxSettingsModal.module.css'

const messages = {
  title: 'Inbox Settings',
  done: 'Done',
  allTitle: 'Allow Messages from Everyone',
  allDescription:
    'Anyone can send you a direct message, regardless of whether you follow them or not.',
  followeeTitle: 'Only Allow Messages From People You Follow',
  followeeDescription:
    'Only users that you follow can send you direct messages.',
  tipperTitle: 'Only Allow Messages From Your Supporters',
  tipperDescription:
    'Only users who have tipped you can send you direct messages.',
  noneTitle: 'No One Can Message You',
  noneDescription:
    'No one will be able to send you direct messages. Note that you will still be able to send messages to others.'
}

const options = [
  {
    title: messages.allTitle,
    description: messages.allDescription,
    value: ChatPermission.ALL
  },
  {
    title: messages.followeeTitle,
    description: messages.followeeDescription,
    value: ChatPermission.FOLLOWEES
  },
  {
    title: messages.tipperTitle,
    description: messages.tipperDescription,
    value: ChatPermission.TIPPERS
  },
  {
    title: messages.noneTitle,
    description: messages.noneDescription,
    value: ChatPermission.NONE
  }
]

export const InboxSettingsModal = () => {
  const [isVisible, setIsVisible] = useModalState('InboxSettings')
  const handleClose = useCallback(() => setIsVisible(false), [setIsVisible])
  return (
    <Modal
      bodyClassName={styles.modalBody}
      onClose={handleClose}
      isOpen={isVisible}
    >
      <ModalHeader onClose={handleClose}>
        <ModalTitle
          title={messages.title}
          icon={<IconMessage className={styles.icon} />}
        />
      </ModalHeader>
      <ModalContent className={styles.modalContent}>
        <RadioButtonGroup name={'inbox-settings'}>
          {options.map((opt) => (
            <ModalRadioItem
              key={opt.title}
              label={opt.title}
              description={opt.description}
              value={opt.value}
            />
          ))}
        </RadioButtonGroup>
        <Button
          className={styles.doneButton}
          text={messages.done}
          onClick={handleClose}
        />
      </ModalContent>
    </Modal>
  )
}
