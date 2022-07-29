import { useState, useEffect } from 'react'

import { Status } from '@audius/common'
import { Modal } from '@audius/stems'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import { getNeedsAccountRecovery } from 'common/store/account/selectors'
import EnterPassword from 'components/sign-on/EnterPassword'
import { RESET_REQUIRED_KEY } from 'store/account/mobileSagas'
import { AppState } from 'store/types'
import { isMobile } from 'utils/clientUtil'

import styles from './PasswordResetModal.module.css'
import { changePassword } from './store/actions'
import { getStatus } from './store/selectors'

const messages = {
  title: 'Reset Your Password',
  continueLabel: 'Submit',
  helpText:
    'Create a password that is secure and easy to remember. Write it down or use a password manager.'
}

type PasswordResetModalProps = ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>

const PasswordResetModal = ({
  isMobile,
  needsAccountRecovery,
  status,
  onChangePassword
}: PasswordResetModalProps) => {
  const [showModal, setShowModal] = useState(needsAccountRecovery)
  const [isLoading, setIsLoading] = useState(false)
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
      <div className={styles.content}>
        <div className={styles.helpText}>{messages.helpText}</div>
        <EnterPassword
          continueLabel={messages.continueLabel}
          onSubmit={onSubmit}
          isMobile={isMobile}
          isLoading={isLoading}
        />
      </div>
    </Modal>
  )
}

function mapStateToProps(state: AppState) {
  return {
    needsAccountRecovery: getNeedsAccountRecovery(state),
    isMobile: isMobile(),
    status: getStatus(state)
  }
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    onChangePassword: (email: string, password: string) =>
      dispatch(changePassword(email, password))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(PasswordResetModal)
