import {
  Flex,
  Text,
  useTheme,
  IconQuestionCircle as IconQuestionMark
} from '@audius/harmony'
import { Modal } from '@audius/stems'
import { CSSObject } from '@emotion/styled'

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
  const { color } = useTheme()

  const renderTitle = () => {
    return (
      <Flex gap='s' alignItems='center'>
        <IconQuestionMark />
        <Text>{messages.forgotPassword}</Text>
      </Flex>
    )
  }

  const onCopyFrom = () => {
    copyToClipboard(messages.from)
  }

  const onCopySubject = () => {
    copyToClipboard(messages.subject)
  }

  const linkCss: CSSObject = {
    cursor: 'pointer',
    ':hover': {
      color: color.secondary.secondary
    }
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
      bodyClassName={styles.modal}
    >
      <Flex direction='column' gap='xl' m='xl'>
        <Text variant='body' strength='strong' textAlign='center'>
          {messages.restoreAccess}
        </Text>
        <Flex gap='m' pv='m' ph='xl' border='strong' borderRadius='m'>
          <Flex
            w={64}
            direction='column'
            gap='m'
            css={{ color: color.neutral.n400 }}
          >
            <Text variant='title'>{messages.fromHeader}</Text>
            <Text variant='title'>{messages.subjectHeader}</Text>
          </Flex>
          <Flex direction='column' gap='m' flex='1'>
            <Toast
              text={messages.copied}
              fillParent={false}
              mount={MountPlacement.PARENT}
              placement={ComponentPlacement.TOP_LEFT}
              requireAccount={false}
              delay={TOOLTIP_DELAY}
            >
              <Text
                variant='title'
                strength='weak'
                onClick={onCopyFrom}
                css={linkCss}
              >
                {messages.from}
              </Text>
            </Toast>
            <Toast
              text={messages.copied}
              fillParent={false}
              mount={MountPlacement.PARENT}
              placement={ComponentPlacement.TOP_LEFT}
              requireAccount={false}
              delay={TOOLTIP_DELAY}
            >
              <Text
                variant='title'
                strength='weak'
                onClick={onCopySubject}
                css={linkCss}
              >
                {messages.subject}
              </Text>
            </Toast>
          </Flex>
        </Flex>
      </Flex>
    </Modal>
  )
}
