import React, { cloneElement, useCallback, useEffect, useState } from 'react'

import { Format, IconTrophy, TokenValueInput } from '@audius/stems'
import BN from 'bn.js'
import cn from 'classnames'
import { useDispatch, useSelector } from 'react-redux'

import { ReactComponent as IconQuestionCircle } from 'assets/img/iconQuestionCircle.svg'
import IconNoTierBadge from 'assets/img/tokenBadgeNoTier.png'
import { BadgeTier } from 'common/models/BadgeTier'
import { ID } from 'common/models/Identifiers'
import { Supporter, Supporting } from 'common/models/Tipping'
import { BNWei, StringAudio, StringWei } from 'common/models/Wallet'
import { getAccountUser } from 'common/store/account/selectors'
import { getProfileUser } from 'common/store/pages/profile/selectors'
import { getSupporters, getSupporting } from 'common/store/tipping/selectors'
import { sendTip } from 'common/store/tipping/slice'
import { getAccountBalance } from 'common/store/wallet/selectors'
import { getTierAndNumberForBalance } from 'common/store/wallet/utils'
import { parseWeiNumber } from 'common/utils/formatUtil'
import { Nullable } from 'common/utils/typeUtils'
import {
  formatWei,
  parseAudioInputToWei,
  stringWeiToBN,
  weiToString
} from 'common/utils/wallet'
import Tooltip from 'components/tooltip/Tooltip'
import { audioTierMapPng } from 'components/user-badges/UserBadges'
import ButtonWithArrow from 'pages/audio-rewards-page/components/ButtonWithArrow'

import styles from './TipAudio.module.css'
import { TipProfilePicture } from './TipProfilePicture'

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
  const supportersMap = useSelector(getSupporters)
  const supportingMap = useSelector(getSupporting)
  const profile = useSelector(getProfileUser)

  const accountBalance = (useSelector(getAccountBalance) ??
    new BN('0')) as BNWei

  const [tipAmount, setTipAmount] = useState<StringAudio>('' as StringAudio)
  const [tipAmountBNWei, setTipAmountBNWei] = useState<BNWei>(
    new BN('0') as BNWei
  )

  const { tier } = getTierAndNumberForBalance(weiToString(accountBalance))
  const audioBadge = audioTierMapPng[tier as BadgeTier]

  const [isDisabled, setIsDisabled] = useState(true)
  const [hasError, setHasError] = useState(false)

  const [
    amountToTipToBecomeTopSupporter,
    setAmountToTipToBecomeTopSupporter
  ] = useState<Nullable<BNWei>>(null)
  const [supporting, setSupporting] = useState<Nullable<Supporting>>(null)
  const [topSupporter, setTopSupporter] = useState<Nullable<Supporter>>(null)
  const [isFirstSupporter, setIsFirstSupporter] = useState(false)

  /**
   * Get supporting info if current user is already supporting profile
   * so that the already supported amount can be used to determine
   * how much is left to tip to become top supporter
   */
  useEffect(() => {
    if (!account || !profile) return

    const supportingForAccount = supportingMap[account.user_id] ?? {}
    const accountSupportingProfile =
      supportingForAccount[profile.user_id] ?? null
    if (accountSupportingProfile) {
      setSupporting(accountSupportingProfile)
    }
  }, [account, profile, supportingMap])

  /**
   * Get user who is top supporter to later check whether it is
   * not the same as the current user
   */
  useEffect(() => {
    if (!profile) return

    const supportersForProfile = supportersMap[profile.user_id] ?? {}
    const rankedSupportersList = Object.keys(supportersForProfile)
      .sort((k1, k2) => {
        return (
          supportersForProfile[(k1 as unknown) as ID].rank -
          supportersForProfile[(k2 as unknown) as ID].rank
        )
      })
      .map(k => supportersForProfile[(k as unknown) as ID])
    const theTopSupporter =
      rankedSupportersList.length > 0 ? rankedSupportersList[0] : null

    if (theTopSupporter) {
      setTopSupporter(theTopSupporter)
    } else {
      setIsFirstSupporter(true)
    }
  }, [profile, supportersMap])

  useEffect(() => {
    const zeroWei = stringWeiToBN('0' as StringWei)
    const newAmountWei = parseAudioInputToWei(tipAmount) ?? zeroWei
    setTipAmountBNWei(newAmountWei)

    const hasInsufficientBalance = newAmountWei.gt(accountBalance)
    setIsDisabled(hasInsufficientBalance || newAmountWei.lte(zeroWei))
    setHasError(hasInsufficientBalance)
  }, [tipAmount, accountBalance])

  const handleTipAmountChange = useCallback(
    (value: string) => {
      setTipAmount(value as StringAudio)
      setAmountToTipToBecomeTopSupporter(null)
    },
    [setTipAmount, setAmountToTipToBecomeTopSupporter]
  )

  /**
   * On blur of tip amount input, check whether or not to display
   * prompt to become top or first supporter
   */
  // todo: also handle scenario (and get correct copy from design) for
  // if you can attain top supporter by completing rewards and tipping the result
  const onBlur = useCallback(() => {
    if (hasError || !account || !topSupporter) return

    const isAlreadyTopSupporter = account.user_id === topSupporter.sender_id
    if (isAlreadyTopSupporter) return

    const topSupporterAmountWei = stringWeiToBN(topSupporter.amount)
    let newAmountToTipToBecomeTopSupporter = topSupporterAmountWei
    if (supporting) {
      const supportingAmountWei = stringWeiToBN(supporting.amount)
      newAmountToTipToBecomeTopSupporter = topSupporterAmountWei.sub(
        supportingAmountWei
      ) as BNWei
    }
    if (
      accountBalance.gte(newAmountToTipToBecomeTopSupporter) &&
      newAmountToTipToBecomeTopSupporter.gte(parseWeiNumber('1') as BNWei)
    ) {
      setAmountToTipToBecomeTopSupporter(newAmountToTipToBecomeTopSupporter)
    }
  }, [hasError, account, topSupporter, supporting, accountBalance])

  const handleSendClick = useCallback(() => {
    dispatch(sendTip({ amount: tipAmountBNWei }))
  }, [dispatch, tipAmountBNWei])

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

  return (
    <div className={styles.container}>
      <TipProfilePicture user={profile} />
      {!hasError && isFirstSupporter ? renderBecomeFirstSupporter() : null}
      {!hasError && amountToTipToBecomeTopSupporter
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
          onBlur={onBlur}
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
      {hasError && (
        <div className={cn(styles.flexCenter, styles.error)}>
          {messages.insufficientBalance}
        </div>
      )}
    </div>
  )
}
