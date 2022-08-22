import { useCallback, useEffect } from 'react'

import {
  Nullable,
  tippingSelectors,
  tippingActions,
  TippingSendStatus,
  walletActions
} from '@audius/common'
import { Modal, ModalHeader, ModalTitle } from '@audius/stems'
import { useDispatch } from 'react-redux'
import { animated, Transition } from 'react-spring/renderprops'
import { usePrevious } from 'react-use'

import { ReactComponent as IconVerifiedGreen } from 'assets/img/iconVerifiedGreen.svg'
import IconGoldBadge from 'assets/img/tokenBadgeGold40@2x.png'
import { useSelector } from 'common/hooks/useSelector'

import { ConfirmSendTip } from './ConfirmSendTip'
import { SendTip } from './SendTip'
import styles from './TipAudio.module.css'
import { TipSent } from './TipSent'
const { getBalance } = walletActions
const { resetSend } = tippingActions
const { getSendStatus } = tippingSelectors

const messages = {
  sendATip: 'Send Tip',
  confirm: 'Confirm',
  sending: 'Sending',
  tipSent: 'Tip Sent',
  holdOn: '⚠️ Hold On a Moment'
}

const GoldBadgeIconImage = () => (
  <img
    draggable={false}
    alt='Gold badge'
    src={IconGoldBadge}
    width={24}
    height={24}
  />
)

const titleMessagesMap: { [key in TippingSendStatus]?: string } = {
  SEND: messages.sendATip,
  CONFIRM: messages.confirm,
  SENDING: messages.sending,
  CONVERTING: messages.holdOn,
  ERROR: messages.confirm,
  SUCCESS: messages.tipSent
}

const titleIconsMap: { [key in TippingSendStatus]?: Nullable<JSX.Element> } = {
  SEND: <GoldBadgeIconImage />,
  CONFIRM: <GoldBadgeIconImage />,
  SENDING: <GoldBadgeIconImage />,
  CONVERTING: null,
  ERROR: <GoldBadgeIconImage />,
  SUCCESS: <IconVerifiedGreen width={24} height={24} />
}

const renderModalContent = (pageNumber: number) => {
  switch (pageNumber) {
    case 0:
      return <SendTip />
    case 1:
      return <ConfirmSendTip />
    case 2:
      return <TipSent />
    default:
      return null
  }
}

const statusOrder = {
  SEND: 0,
  CONFIRM: 1,
  SENDING: 1,
  CONVERTING: 1,
  ERROR: 1,
  SUCCESS: 2
}

const defaultTransitions = {
  initial: { opacity: 1, transform: 'translate3d(0%, 0, 0)' },
  enter: { opacity: 1, transform: 'translate3d(0%, 0 ,0)' }
}

const nextScreenTransition = {
  ...defaultTransitions,
  // Next screen enters from right
  from: { opacity: 0, transform: 'translate3d(100%, 0, 0)' },
  // Current screen leaves on left
  leave: { opacity: 0, transform: 'translate3d(-100%, 0, 0)' }
}

const previousScreenTransition = {
  ...defaultTransitions,
  // Previous screen enters from left
  from: { opacity: 0, transform: 'translate3d(-100%, 0, 0)' },
  // Current screen leaves on right
  leave: { opacity: 0, transform: 'translate3d(100%, 0, 0)' }
}

export const TipAudioModal = () => {
  const dispatch = useDispatch()
  const sendStatus = useSelector(getSendStatus)
  const previousSendStatus = usePrevious(sendStatus)

  const onClose = useCallback(() => {
    dispatch(resetSend())
  }, [dispatch])

  useEffect(() => {
    if (sendStatus !== null) {
      dispatch(getBalance())
    }
  }, [dispatch, sendStatus])

  const transitions =
    !previousSendStatus ||
    !sendStatus ||
    statusOrder[sendStatus] >= statusOrder[previousSendStatus]
      ? nextScreenTransition
      : previousScreenTransition

  return (
    <Modal
      isOpen={sendStatus !== null}
      onClose={onClose}
      bodyClassName={styles.modalBody}
      dismissOnClickOutside={
        sendStatus !== 'SENDING' && sendStatus !== 'CONVERTING'
      }
    >
      <ModalHeader
        className={styles.modalHeader}
        onClose={onClose}
        dismissButtonClassName={styles.dismissButton}
        showDismissButton={
          sendStatus !== 'SENDING' && sendStatus !== 'CONVERTING'
        }
      >
        <ModalTitle
          title={sendStatus ? titleMessagesMap[sendStatus] : ''}
          icon={sendStatus ? titleIconsMap[sendStatus] : null}
          iconClassName={styles.modalTitleIcon}
        />
      </ModalHeader>
      <div className={styles.modalContentContainer}>
        <Transition
          items={sendStatus !== null ? statusOrder[sendStatus] : 0}
          initial={transitions.initial}
          from={transitions.from}
          enter={transitions.enter}
          leave={transitions.leave}
          unique={true}
        >
          {(item) => (style) =>
            (
              <animated.div style={{ ...style }}>
                {renderModalContent(item)}
              </animated.div>
            )}
        </Transition>
      </div>
    </Modal>
  )
}
