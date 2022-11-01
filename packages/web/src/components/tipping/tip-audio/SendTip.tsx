import {
  cloneElement,
  ReactNode,
  useCallback,
  useEffect,
  useState
} from 'react'

import {
  BadgeTier,
  BNWei,
  StringAudio,
  StringWei,
  formatWei,
  stringWeiToBN,
  weiToString,
  accountSelectors,
  tippingSelectors,
  tippingActions,
  walletSelectors,
  getTierAndNumberForBalance,
  useGetFirstOrTopSupporter,
  OnRampProvider,
  buyAudioActions,
  FeatureFlags
} from '@audius/common'
import {
  IconTrophy,
  TokenAmountInput,
  TokenAmountInputChangeHandler
} from '@audius/stems'
import BN from 'bn.js'
import cn from 'classnames'
import { useDispatch, useSelector } from 'react-redux'

import { ReactComponent as IconQuestionCircle } from 'assets/img/iconQuestionCircle.svg'
import IconNoTierBadge from 'assets/img/tokenBadgeNoTier.png'
import { OnRampButton } from 'components/on-ramp-button'
import Tooltip from 'components/tooltip/Tooltip'
import { audioTierMapPng } from 'components/user-badges/UserBadges'
import { useFlag } from 'hooks/useRemoteConfig'
import ButtonWithArrow from 'pages/audio-rewards-page/components/ButtonWithArrow'

import { ProfileInfo } from '../../profile-info/ProfileInfo'

import styles from './TipAudio.module.css'

const { getAccountBalance } = walletSelectors
const { getOptimisticSupporters, getOptimisticSupporting, getSendUser } =
  tippingSelectors
const { beginTip, resetSend, fetchUserSupporter, sendTip } = tippingActions
const { startBuyAudioFlow } = buyAudioActions
const getAccountUser = accountSelectors.getAccountUser

const messages = {
  availableToSend: 'AVAILABLE TO SEND',
  sendATip: 'Send Tip',
  enterAnAmount: 'Enter an amount',
  insufficientBalance: 'Insufficient Balance',
  tooltip: '$AUDIO held in linked wallets cannot be used for tipping',
  becomeTopSupporterPrefix: 'Send ',
  becomeTopSupporterSuffix: ' $AUDIO To Become Top Supporter',
  becomeFirstSupporter: 'Send A Tip To Become Their First Supporter',
  inputLabel: 'Amount of audio to tip',
  inputPlaceholder: 'Enter an amount',
  inputTokenLabel: '$AUDIO',
  buyAudioPrefix: 'Buy $AUDIO using '
}

const TopBanner = ({ icon, text }: { icon?: ReactNode; text: ReactNode }) => (
  <div className={styles.topBanner}>
    {icon ? <span className={styles.topBannerIcon}>{icon}</span> : null}
    <span className={styles.topBannerText}>{text}</span>
  </div>
)

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

  const { isEnabled: isBuyAudioEnabled } = useFlag(
    FeatureFlags.BUY_AUDIO_ENABLED
  )
  const { isEnabled: isStripeBuyAudioEnabled } = useFlag(
    FeatureFlags.BUY_AUDIO_STRIPE_ENABLED
  )

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

  const handleTipAmountChange = useCallback<TokenAmountInputChangeHandler>(
    (value) => {
      setTipAmount(value as StringAudio)
    },
    [setTipAmount]
  )

  const handleSendClick = useCallback(() => {
    dispatch(sendTip({ amount: tipAmount }))
  }, [dispatch, tipAmount])

  const handleBuyWithStripeClicked = useCallback(() => {
    dispatch(
      startBuyAudioFlow({
        provider: OnRampProvider.STRIPE,
        onSuccess: {
          action: beginTip({ user: receiver, source: 'buyAudio' })
        }
      })
    )
    dispatch(resetSend())
  }, [dispatch, receiver])

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

  const topBanner =
    !hasInsufficientBalance && isFirstSupporter ? (
      <TopBanner icon={<IconTrophy />} text={messages.becomeFirstSupporter} />
    ) : !hasInsufficientBalance && amountToTipToBecomeTopSupporter ? (
      <TopBanner
        icon={<IconTrophy />}
        text={
          <>
            {messages.becomeTopSupporterPrefix}
            <span className={styles.amount}>
              {formatWei(
                amountToTipToBecomeTopSupporter ?? new BN('0'),
                true,
                0
              )}
            </span>
            {messages.becomeTopSupporterSuffix}
          </>
        }
      />
    ) : isBuyAudioEnabled && isStripeBuyAudioEnabled ? (
      <div>
        <OnRampButton
          buttonPrefix={messages.buyAudioPrefix}
          provider={OnRampProvider.STRIPE}
          className={styles.buyAudioButton}
          textClassName={styles.buyAudioButtonText}
          onClick={handleBuyWithStripeClicked}
        />
      </div>
    ) : null

  return receiver ? (
    <div
      className={cn(
        styles.container,
        {
          [styles.containerFill]: !!topBanner
        },
        {
          [styles.containerDense]:
            hasInsufficientBalance &&
            isBuyAudioEnabled &&
            isStripeBuyAudioEnabled
        }
      )}
    >
      {topBanner}
      {topBanner !== null ? <div className={styles.divider}></div> : null}
      <ProfileInfo user={receiver} />
      <div className={styles.amountToSend}>
        <TokenAmountInput
          aria-label={messages.inputLabel}
          placeholder={messages.inputPlaceholder}
          tokenLabel={messages.inputTokenLabel}
          value={tipAmount}
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
