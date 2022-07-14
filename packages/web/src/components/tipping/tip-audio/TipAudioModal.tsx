import { useCallback } from 'react'

import { useDispatch } from 'react-redux'
import { animated, Transition } from 'react-spring/renderprops'
import { usePrevious } from 'react-use'

import { ReactComponent as IconVerifiedGreen } from 'assets/img/iconVerifiedGreen.svg'
import IconGoldBadge from 'assets/img/tokenBadgeGold40@2x.png'
import { useSelector } from 'common/hooks/useSelector'
import { getSendStatus } from 'common/store/tipping/selectors'
import { resetSend } from 'common/store/tipping/slice'
import { TippingSendStatus } from 'common/store/tipping/types'
import ModalDrawer from 'pages/audio-rewards-page/components/modals/ModalDrawer'

import { ConfirmSendTip } from './ConfirmSendTip'
import { SendTip } from './SendTip'
import styles from './TipAudio.module.css'
import { TipSent } from './TipSent'

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

const titlesMap: { [key in TippingSendStatus]?: JSX.Element | string } = {
  SEND: (
    <div className={styles.tipIconTextContainer}>
      <GoldBadgeIconImage />
      <span className={styles.tipText}>{messages.sendATip}</span>
    </div>
  ),
  CONFIRM: (
    <div className={styles.tipIconTextContainer}>
      <GoldBadgeIconImage />
      <span className={styles.tipText}>{messages.confirm}</span>
    </div>
  ),
  SENDING: (
    <div className={styles.tipIconTextContainer}>
      <GoldBadgeIconImage />
      <span className={styles.tipText}>{messages.sending}</span>
    </div>
  ),
  CONVERTING: (
    <div className={styles.tipIconTextContainer}>
      <span className={styles.tipText}>{messages.holdOn}</span>
    </div>
  ),
  ERROR: (
    <div className={styles.tipIconTextContainer}>
      <GoldBadgeIconImage />
      <span className={styles.tipText}>{messages.confirm}</span>
    </div>
  ),
  SUCCESS: (
    <div className={styles.tipIconTextContainer}>
      <IconVerifiedGreen width={24} height={24} />
      <span className={styles.tipText}>{messages.tipSent}</span>
    </div>
  )
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

  const transitions =
    !previousSendStatus ||
    !sendStatus ||
    statusOrder[sendStatus] >= statusOrder[previousSendStatus]
      ? nextScreenTransition
      : previousScreenTransition

  return (
    <ModalDrawer
      isOpen={sendStatus !== null}
      onClose={onClose}
      bodyClassName={styles.modalBody}
      showTitleHeader
      title={sendStatus ? titlesMap[sendStatus] : ''}
      showDismissButton={
        sendStatus !== 'SENDING' && sendStatus !== 'CONVERTING'
      }
      dismissOnClickOutside={
        sendStatus !== 'SENDING' && sendStatus !== 'CONVERTING'
      }
      contentHorizontalPadding={24}
      useGradientTitle={false}>
      <div className={styles.modalContentContainer}>
        <Transition
          items={sendStatus !== null ? statusOrder[sendStatus] : 0}
          initial={transitions.initial}
          from={transitions.from}
          enter={transitions.enter}
          leave={transitions.leave}
          unique={true}>
          {(item) => (style) =>
            (
              <animated.div style={{ ...style }}>
                {renderModalContent(item)}
              </animated.div>
            )}
        </Transition>
      </div>
    </ModalDrawer>
  )
}
