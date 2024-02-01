import { ChangeEvent, useCallback, useEffect } from 'react'

import { Status, useSetInboxPermissions } from '@audius/common'
import { ChatPermission } from '@audius/sdk'
import {
  Button,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  RadioButtonGroup
} from '@audius/stems'
import { IconMessage } from '@audius/harmony'

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
    'Only users that you follow can initiate direct messages with you. You can still send messages to anyone.',
  tipperTitle: 'Only Allow Messages From Your Supporters',
  tipperDescription:
    'Only users who have tipped you can initiate direct messages with you. You can still send messages to anyone.',
  noneTitle: 'No One Can Message You',
  noneDescription:
    'Disable incoming direct messages entirely. You will no longer receive direct messages, but can still send messages to others.'
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

  const {
    localPermission,
    setLocalPermission,
    savePermissions,
    doFetchPermissions,
    permissionStatus,
    showSpinner
  } = useSetInboxPermissions({
    audiusSdk
  })

  const handleSave = useCallback(() => {
    savePermissions()
    handleClose()
  }, [handleClose, savePermissions])

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setLocalPermission(e.target.value as ChatPermission)
    },
    [setLocalPermission]
  )

  // Fetch the latest permissions for the current user when the modal is made visible
  // Note that this will trigger the following effect as well, causing the permission state to update
  useEffect(() => {
    doFetchPermissions()
  }, [doFetchPermissions])

  return (
    <Modal
      bodyClassName={styles.modalBody}
      onClose={handleClose}
      isOpen={isVisible}
    >
      <ModalHeader onClose={handleClose}>
        <ModalTitle title={messages.title} icon={<IconMessage />} />
      </ModalHeader>
      <ModalContent className={styles.modalContent}>
        <RadioButtonGroup
          name={'inbox-settings'}
          value={localPermission}
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
      </ModalContent>
      <ModalFooter>
        <Button
          rightIcon={
            permissionStatus === Status.LOADING && showSpinner ? (
              <LoadingSpinner className={styles.spinner} />
            ) : undefined
          }
          className={styles.saveButton}
          text={messages.save}
          onClick={handleSave}
        />
        {permissionStatus === Status.ERROR ? (
          <span className={styles.error}>{messages.error}</span>
        ) : null}
      </ModalFooter>
    </Modal>
  )
}

export default InboxSettingsModal
