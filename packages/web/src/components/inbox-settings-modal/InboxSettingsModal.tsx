import { ChangeEvent, useCallback, useState } from 'react'

import { Status } from '@audius/common'
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
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import { audiusSdk } from 'services/audius-sdk'

import { ModalRadioItem } from '../modal-radio/ModalRadioItem'

import styles from './InboxSettingsModal.module.css'

const messages = {
  title: 'Inbox Settings',
  save: 'Save Changes',
  error: 'Something went wrong. Please try again.',
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
  const [permission, setPermission] = useState<ChatPermission>(
    ChatPermission.ALL
  )
  const [saveState, setSaveState] = useState<Status>(Status.IDLE)
  const [showSpinner, setShowSpinner] = useState(false)

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setPermission(e.target.value as ChatPermission)
    },
    [setPermission]
  )

  const handleSave = useCallback(() => {
    if (saveState !== Status.LOADING) {
      setSaveState(Status.LOADING)
      setShowSpinner(false)
      // Only show the spinner if saving takes a while
      setTimeout(() => setShowSpinner(true), 1000)
      const fn = async () => {
        try {
          const sdk = await audiusSdk()
          await sdk.chats.permit({ permit: permission })
          setSaveState(Status.SUCCESS)
          handleClose()
        } catch (e) {
          console.error('Error saving chat permissions:', e)
          setSaveState(Status.ERROR)
        }
      }
      fn()
    }
  }, [saveState, permission, setSaveState, handleClose, setShowSpinner])

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
        <RadioButtonGroup
          name={'inbox-settings'}
          value={permission}
          onChange={handleChange}
        >
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
          rightIcon={
            saveState === Status.LOADING && showSpinner ? (
              <LoadingSpinner className={styles.spinner} />
            ) : undefined
          }
          className={styles.saveButton}
          text={messages.save}
          onClick={handleSave}
        />
        {saveState === Status.ERROR ? (
          <span className={styles.error}>{messages.error}</span>
        ) : null}
      </ModalContent>
    </Modal>
  )
}
