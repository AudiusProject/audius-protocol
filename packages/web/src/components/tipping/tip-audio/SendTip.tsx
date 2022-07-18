import { cloneElement, useCallback, useEffect, useState } from 'react'

import { Format, IconTrophy, TokenValueInput } from '@audius/stems'
import BN from 'bn.js'
import cn from 'classnames'
import { useDispatch, useSelector } from 'react-redux'

import { ReactComponent as IconQuestionCircle } from 'assets/img/iconQuestionCircle.svg'
import IconNoTierBadge from 'assets/img/tokenBadgeNoTier.png'
import { BadgeTier } from 'common/models/BadgeTier'
import { BNWei, StringAudio, StringWei } from 'common/models/Wallet'
import { getAccountUser } from 'common/store/account/selectors'
import {
  getOptimisticSupporters,
  getOptimisticSupporting,
  getSendUser
} from 'common/store/tipping/selectors'
import { fetchUserSupporter, sendTip } from 'common/store/tipping/slice'
import { getAccountBalance } from 'common/store/wallet/selectors'
import { getTierAndNumberForBalance } from 'common/store/wallet/utils'
import { formatWei, stringWeiToBN, weiToString } from 'common/utils/wallet'
import Tooltip from 'components/tooltip/Tooltip'
import { audioTierMapPng } from 'components/user-badges/UserBadges'
import { useGetFirstOrTopSupporter } from 'hooks/useGetFirstOrTopSupporter'
import ButtonWithArrow from 'pages/audio-rewards-page/components/ButtonWithArrow'

import { ProfileInfo } from '../../profile-info/ProfileInfo'

import styles from './TipAudio.module.css'

const messages = {
  availableToSend: 'AVAILABLE TO SEND',
  sendATip: 'Send Tip',
  enterAnAmount: 'Enter an amount',
  insufficientBalance: 'Insufficient Balance',
  tooltip: '$AUDIO held in linked wallets cannot be used for tipping',
  becomeTopSupporterPrefix: 'Tip ',
  becomeTopSupporterSuffix: ' $AUDIO To Become Their Top Supporter',
  becomeFirstSupporter: 'Tip To Become Their First Supporter'
}

export const SendTip = () => {
  const dispatch = useDispatch()
  const account = useSelector(getAccountUser)
  const supportersMap = useSelector(getOptimisticSupporters)
  const supportingMap = useSelector(getOptimisticSupporting)
  const receiver = useSelector(getSendUser)

  const accountBalance = (useSelector(getAccountBalance) ??
    new BN('0')) as BNWei

  const [tipAmount, setTipAmount] = useState('')

  const { tier } = getTierAndNumberForBalance(weiToString(accountBalance))
  const audioBadge = audioTierMapPng[tier as BadgeTier]

  const [isDisabled, setIsDisabled] = useState(true)

  const {
    amountToTipToBecomeTopSupporter,
    shouldFetchUserSupporter,
    isFirstSupporter,
    tipAmountWei,
    hasInsufficientBalance
  } = useGetFirstOrTopSupporter({
    tipAmount,
    accountBalance,
    account,
    receiver,
    supportingMap,
    supportersMap
  })

  useEffect(() => {
    if (shouldFetchUserSupporter && account && receiver) {
      dispatch(
        fetchUserSupporter({
          currentUserId: account.user_id,
          userId: receiver.user_id,
          supporterUserId: account.user_id
        })
      )
    }
  }, [shouldFetchUserSupporter, account, receiver, dispatch])

  useEffect(() => {
    const zeroWei = stringWeiToBN('0' as StringWei)
    setIsDisabled(hasInsufficientBalance || tipAmountWei.lte(zeroWei))
  }, [hasInsufficientBalance, tipAmountWei])

  const handleTipAmountChange = useCallback(
    (value: string) => {
      setTipAmount(value as StringAudio)
    },
    [setTipAmount]
  )

  const handleSendClick = useCallback(() => {
    dispatch(sendTip({ amount: tipAmount }))
  }, [dispatch, tipAmount])

  const renderBecomeFirstSupporter = () => (
    <div className={cn(styles.flexCenter, styles.becomeTopSupporter)}>
      <IconTrophy className={styles.becomeTopSupporterTrophy} />
      <span>{messages.becomeFirstSupporter}</span>
    </div>
  )

  const renderBecomeTopSupporter = () =>
    amountToTipToBecomeTopSupporter ? (
      <div className={cn(styles.flexCenter, styles.becomeTopSupporter)}>
        <IconTrophy className={styles.becomeTopSupporterTrophy} />
        <span>
          {messages.becomeTopSupporterPrefix}
          {formatWei(amountToTipToBecomeTopSupporter, true, 0)}
          {messages.becomeTopSupporterSuffix}
        </span>
      </div>
    ) : null

  const renderAvailableAmount = () => (
    <div className={styles.amountAvailableContainer}>
      <div className={styles.amountAvailableText}>
        {messages.availableToSend}
        <Tooltip text={messages.tooltip} mount='parent'>
          <span>
            <IconQuestionCircle
              className={styles.amountAvailableInfo}
              width={18}
              height={18}
            />
          </span>
        </Tooltip>
      </div>
      <div className={styles.amountContainer}>
        {audioBadge ? (
          cloneElement(audioBadge, {
            height: 16,
            width: 16
          })
        ) : (
          <img alt='no tier' src={IconNoTierBadge} width='16' height='16' />
        )}
        <span className={styles.amountAvailable}>
          {formatWei(accountBalance, true, 0)}
        </span>
      </div>
    </div>
  )

  return receiver ? (
    <div className={styles.container}>
      <ProfileInfo user={receiver} />
      {!hasInsufficientBalance && isFirstSupporter
        ? renderBecomeFirstSupporter()
        : null}
      {!hasInsufficientBalance && amountToTipToBecomeTopSupporter
        ? renderBecomeTopSupporter()
        : null}
      <div className={styles.amountToSend}>
        <TokenValueInput
          className={styles.inputContainer}
          rightLabelClassName={styles.rightLabel}
          inputClassName={styles.input}
          format={Format.INPUT}
          placeholder={'Enter an amount'}
          rightLabel={'$AUDIO'}
          value={tipAmount}
          isNumeric={true}
          isWhole={true}
          onChange={handleTipAmountChange}
        />
      </div>
      {renderAvailableAmount()}
      <div className={cn(styles.flexCenter, styles.buttonContainer)}>
        <ButtonWithArrow
          text={messages.sendATip}
          onClick={handleSendClick}
          textClassName={styles.buttonText}
          className={cn(styles.buttonText, { [styles.disabled]: isDisabled })}
          disabled={isDisabled}
        />
      </div>
      {hasInsufficientBalance && (
        <div className={cn(styles.flexCenter, styles.error)}>
          {messages.insufficientBalance}
        </div>
      )}
    </div>
  ) : null
}
