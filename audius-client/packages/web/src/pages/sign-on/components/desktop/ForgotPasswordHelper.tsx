import React from 'react'

import { Modal } from '@audius/stems'

import { ReactComponent as IconQuestionMark } from 'assets/img/iconQuestionMark.svg'

import styles from './ForgotPasswordHelper.module.css'

const messages = {
  forgotPassword: 'Forgot Your Password',
  restoreAccess:
    'To restore access to your account, search for the email we sent when you first signed up.',
  fromHeader: 'From:',
  subjectHeader: 'Subject:',
  from: 'recovery@audius.co',
  subject: '"Save This Email: Audius Password Recovery"'
}

type ForgotPasswordHelperProps = {
  isOpen: boolean
  onClose(): void
}

export const ForgotPasswordHelper = ({
  isOpen,
  onClose
}: ForgotPasswordHelperProps) => {
  const renderTitle = () => {
    return (
      <>
        <IconQuestionMark className={styles.questionButtonIcon} />
        <div className={styles.headerText}>{messages.forgotPassword}</div>
      </>
    )
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      showTitleHeader
      showDismissButton
      title={renderTitle()}
      allowScroll={false}
      dismissOnClickOutside={true}
      bodyClassName={styles.modalWidth}
    >
      <div className={styles.modalBody}>
        <div className={styles.restoreAccessText}>{messages.restoreAccess}</div>
        <div className={styles.emailContainer}>
          <div className={styles.emailSubheadings}>
            <div>{messages.fromHeader}</div>
            <div>{messages.subjectHeader}</div>
          </div>
          <div className={styles.emailText}>
            <div>{messages.from}</div>
            <div>{messages.subject}</div>
          </div>
        </div>
      </div>
    </Modal>
  )
}
