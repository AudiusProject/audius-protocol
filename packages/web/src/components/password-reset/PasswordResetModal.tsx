import { useEffect, useState } from 'react'

import { Status, accountSelectors } from '@audius/common'
import { Flex, Text } from '@audius/harmony'
import { Modal } from '@audius/stems'
import { useDispatch, useSelector } from 'react-redux'

import EnterPassword from 'components/sign-on/EnterPassword'

import styles from './PasswordResetModal.module.css'
import { changePassword } from './store/actions'
import { getStatus } from './store/selectors'

const { getNeedsAccountRecovery } = accountSelectors

const RESET_REQUIRED_KEY = 'password-reset-required'

const messages = {
  title: 'Reset Your Password',
  continueLabel: 'Submit',
  helpText:
    'Create a password that is secure and easy to remember. Write it down or use a password manager.'
}

export const PasswordResetModal = () => {
  const dispatch = useDispatch()
  const needsAccountRecovery = useSelector(getNeedsAccountRecovery)
  const [showModal, setShowModal] = useState(needsAccountRecovery)
  const [isLoading, setIsLoading] = useState(false)
  const status = useSelector(getStatus)

  const onChangePassword = (email: string, password: string) => {
    dispatch(changePassword(email, password))
  }

  // When the component mounts, show the modal if the reset key exists
  useEffect(() => {
    const resetRequiredEmail = window.localStorage.getItem(RESET_REQUIRED_KEY)
    if (resetRequiredEmail) setShowModal(true)

    // Clean up the required set key when the user leaves
    window.addEventListener('beforeunload', () => {
      window.localStorage.removeItem(RESET_REQUIRED_KEY)
    })
  }, [needsAccountRecovery])

  // Cleanup RESET_REQUIRED_KEY on unmount
  useEffect(
    () => () => {
      window.localStorage.removeItem(RESET_REQUIRED_KEY)
    },
    []
  )

  // When the status changes, if success clear the key and close the modal.
  // Otherwise, let the user try again or close the modal.
  useEffect(() => {
    if (status === Status.SUCCESS) {
      window.localStorage.removeItem(RESET_REQUIRED_KEY)
      setShowModal(false)
      setIsLoading(false)
    }
    if (status === Status.ERROR) {
      setIsLoading(false)
    }
  }, [status])

  const onSubmit = (password: string) => {
    const resetRequiredEmail = decodeURIComponent(
      // @ts-ignore
      window.localStorage.getItem(RESET_REQUIRED_KEY)
    )
    onChangePassword(resetRequiredEmail, password)
    setIsLoading(true)
    window.localStorage.removeItem(RESET_REQUIRED_KEY)
  }

  return (
    <Modal
      title={messages.title}
      dismissOnClickOutside={false}
      isOpen={showModal}
      onClose={() => {}}
      showTitleHeader
      bodyClassName={styles.modalBody}
      headerContainerClassName={styles.modalHeader}
      titleClassName={styles.modalTitle}
    >
      <Flex direction='column' gap='xl' p='l'>
        <Text variant='body' strength='weak' textAlign='center'>
          {messages.helpText}
        </Text>
        <EnterPassword
          continueLabel={messages.continueLabel}
          onSubmit={onSubmit}
          isLoading={isLoading}
        />
      </Flex>
    </Modal>
  )
}
