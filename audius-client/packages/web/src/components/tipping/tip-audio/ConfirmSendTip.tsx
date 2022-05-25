import React, { useCallback, useEffect, useState } from 'react'

import { Button, ButtonType, IconCheck } from '@audius/stems'
import cn from 'classnames'
import { useDispatch, useSelector } from 'react-redux'

import { ReactComponent as IconCaretLeft } from 'assets/img/iconCaretLeft.svg'
import { ReactComponent as IconSend } from 'assets/img/iconSend.svg'
import {
  getSendAmount,
  getSendStatus,
  getSendUser
} from 'common/store/tipping/selectors'
import { confirmSendTip, beginTip } from 'common/store/tipping/slice'
import { formatWei } from 'common/utils/wallet'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'

import styles from './TipAudio.module.css'
import { TipProfilePicture } from './TipProfilePicture'

const messages = {
  sending: 'SENDING',
  areYouSure: 'Are you sure? This cannot be reversed.',
  confirmTip: 'Confirm Tip',
  confirmAndTryAgain: 'Confirm & Try Again',
  goBack: 'Go Back',
  somethingWrong: 'Something’s gone wrong. Wait a little while and try again.',
  maintenance: 'We’re performing some necessary one-time maintenence.',
  fewMinutes: 'This may take a few minutes.',
  holdOn: 'Don’t close this window or refresh the page.'
}

const EmptyContainer = () => (
  <div className={cn(styles.flexCenter, styles.info, styles.empty)} />
)

const ConfirmInfo = () => (
  <div className={cn(styles.flexCenter, styles.info)}>
    {messages.areYouSure}
  </div>
)

const ConvertingInfo = () => (
  <div>
    <div className={cn(styles.flexCenter, styles.info)}>
      {messages.maintenance}
    </div>
    <div className={cn(styles.flexCenter, styles.textCenter, styles.info)}>
      {messages.fewMinutes}
      <br />
      {messages.holdOn}
    </div>
  </div>
)

export const ConfirmSendTip = () => {
  const dispatch = useDispatch()
  const sendStatus = useSelector(getSendStatus)
  const sendAmount = useSelector(getSendAmount)
  const receiver = useSelector(getSendUser)
  const [isDisabled, setIsDisabled] = useState(false)

  useEffect(() => {
    setIsDisabled(sendStatus !== 'CONFIRM' && sendStatus !== 'ERROR')
  }, [sendStatus])

  const handleConfirmSendClick = useCallback(() => {
    dispatch(confirmSendTip())
  }, [dispatch])

  const handleGoBackClick = useCallback(() => {
    if (!isDisabled) {
      dispatch(beginTip({ user: receiver }))
    }
  }, [isDisabled, dispatch, receiver])

  const renderSendingAudio = () => (
    <>
      <div className={cn(styles.flexCenter, styles.sendingContainer)}>
        <span className={styles.sendingIcon}>
          <IconSend />
        </span>
        {messages.sending}
      </div>
      <div className={cn(styles.flexCenter, styles.sendingAudio)}>
        <span className={styles.sendAmount}>{formatWei(sendAmount, true)}</span>
        $AUDIO
      </div>
    </>
  )

  const renderError = () => (
    <div className={cn(styles.flexCenter, styles.error)}>
      {messages.somethingWrong}
    </div>
  )

  return receiver ? (
    <div className={styles.container}>
      {renderSendingAudio()}
      <TipProfilePicture user={receiver} />
      {sendStatus === 'SENDING' && <EmptyContainer />}
      {sendStatus === 'CONFIRM' && <ConfirmInfo />}
      {sendStatus === 'CONVERTING' && <ConvertingInfo />}
      {sendStatus === 'ERROR' && renderError()}
      <div className={cn(styles.flexCenter, styles.buttonContainer)}>
        <Button
          type={ButtonType.PRIMARY}
          text={
            sendStatus === 'ERROR'
              ? messages.confirmAndTryAgain
              : messages.confirmTip
          }
          onClick={handleConfirmSendClick}
          rightIcon={
            sendStatus === 'SENDING' || sendStatus === 'CONVERTING' ? (
              <LoadingSpinner className={styles.loadingSpinner} />
            ) : (
              <IconCheck />
            )
          }
          disabled={isDisabled}
          className={cn(styles.button, { [styles.disabled]: isDisabled })}
        />
      </div>
      {sendStatus !== 'SENDING' && sendStatus !== 'CONVERTING' ? (
        <div
          className={cn(styles.flexCenter, styles.goBackContainer, {
            [styles.disabled]: isDisabled
          })}
          onClick={handleGoBackClick}
        >
          <IconCaretLeft />
          <span className={styles.goBack}>{messages.goBack}</span>
        </div>
      ) : null}
    </div>
  ) : null
}
