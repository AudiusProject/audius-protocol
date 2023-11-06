import { Modal } from '@audius/stems'

import IconQuestionMark from 'assets/img/iconQuestionMark.svg'
import Toast from 'components/toast/Toast'
import { MountPlacement, ComponentPlacement } from 'components/types'
import { copyToClipboard } from 'utils/clipboardUtil'

import styles from './ForgotPasswordHelper.module.css'

const messages = {
  forgotPassword: 'Forgot Your Password',
  restoreAccess:
    'To restore access to your account, please search for the email we sent when you first signed up.',
  fromHeader: 'From:',
  subjectHeader: 'Subject:',
  from: 'recovery@audius.co',
  subject: '"Save This Email: Audius Password Recovery"',
  copied: 'Copied to Clipboard!'
}

type ForgotPasswordHelperProps = {
  isOpen: boolean
  onClose(): void
}

const TOOLTIP_DELAY = 1000

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

  const onCopyFrom = () => {
    copyToClipboard(messages.from)
  }

  const onCopySubject = () => {
    copyToClipboard(messages.subject)
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
            <Toast
              text={messages.copied}
              fillParent={false}
              mount={MountPlacement.PARENT}
              placement={ComponentPlacement.TOP_LEFT}
              requireAccount={false}
              delay={TOOLTIP_DELAY}
            >
              <div onClick={onCopyFrom} className={styles.emailBody}>
                {messages.from}
              </div>
            </Toast>
            <Toast
              text={messages.copied}
              fillParent={false}
              mount={MountPlacement.PARENT}
              placement={ComponentPlacement.TOP_LEFT}
              requireAccount={false}
              delay={TOOLTIP_DELAY}
            >
              <div onClick={onCopySubject} className={styles.emailBody}>
                {messages.subject}
              </div>
            </Toast>
          </div>
        </div>
      </div>
    </Modal>
  )
}
