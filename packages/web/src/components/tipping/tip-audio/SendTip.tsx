import {
  cloneElement,
  ReactNode,
  useCallback,
  useEffect,
  useState
} from 'react'

import { useGetFirstOrTopSupporter } from '@audius/common/hooks'
import { BadgeTier, StringWei, StringAudio, BNWei } from '@audius/common/models'
import { StringKeys, FeatureFlags } from '@audius/common/services'
import {
  accountSelectors,
  tippingSelectors,
  tippingActions,
  walletSelectors,
  getTierAndNumberForBalance,
  buyAudioActions,
  OnRampProvider
} from '@audius/common/store'
import {
  isNullOrUndefined,
  stringWeiToBN,
  weiToString,
  formatWei
} from '@audius/common/utils'
import {
  IconQuestionCircle,
  IconTokenNoTier,
  IconArrowRight as IconArrow,
  IconTrophy,
  TokenAmountInput,
  TokenAmountInputChangeHandler
} from '@audius/harmony'
import { ButtonType, Button } from '@audius/stems'
import BN from 'bn.js'
import cn from 'classnames'
import { useDispatch, useSelector } from 'react-redux'

import { OnRampButton } from 'components/on-ramp-button'
import Skeleton from 'components/skeleton/Skeleton'
import Tooltip from 'components/tooltip/Tooltip'
import { audioTierMapSVG } from 'components/user-badges/UserBadges'
import { useFlag, useRemoteVar } from 'hooks/useRemoteConfig'

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
  inputLabel: 'Amount to tip',
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

  const accountBalance = useSelector(getAccountBalance)
  const [tipAmount, setTipAmount] = useState('')

  const { tier } = getTierAndNumberForBalance(
    weiToString(accountBalance ?? (new BN('0') as BNWei))
  )
  const audioBadge = audioTierMapSVG[tier as BadgeTier]

  const [isDisabled, setIsDisabled] = useState(true)

  const {
    amountToTipToBecomeTopSupporter,
    shouldFetchUserSupporter,
    isFirstSupporter,
    tipAmountWei,
    hasInsufficientBalance
  } = useGetFirstOrTopSupporter({
    tipAmount,
    accountBalance: accountBalance ?? (new BN('0') as BNWei),
    account,
    receiver,
    supportingMap,
    supportersMap
  })

  const { isEnabled: isStripeBuyAudioEnabled } = useFlag(
    FeatureFlags.BUY_AUDIO_STRIPE_ENABLED
  )
  const audioFeaturesDegradedText = useRemoteVar(
    StringKeys.AUDIO_FEATURES_DEGRADED_TEXT
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
          <IconTokenNoTier size='s' />
        )}
        <span className={styles.amountAvailable}>
          {isNullOrUndefined(accountBalance) ? (
            <Skeleton width='20px' height='14px' />
          ) : (
            formatWei(accountBalance, true, 0)
          )}
        </span>
      </div>
    </div>
  )

  const topBanner = audioFeaturesDegradedText ? (
    <TopBanner text={audioFeaturesDegradedText} />
  ) : !hasInsufficientBalance && isFirstSupporter ? (
    <TopBanner icon={<IconTrophy />} text={messages.becomeFirstSupporter} />
  ) : !hasInsufficientBalance && amountToTipToBecomeTopSupporter ? (
    <TopBanner
      icon={<IconTrophy />}
      text={
        <>
          {messages.becomeTopSupporterPrefix}
          <span className={styles.amount}>
            {formatWei(amountToTipToBecomeTopSupporter ?? new BN('0'), true, 0)}
          </span>
          {messages.becomeTopSupporterSuffix}
        </>
      }
    />
  ) : isStripeBuyAudioEnabled ? (
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
            hasInsufficientBalance && isStripeBuyAudioEnabled
        }
      )}
    >
      {topBanner}
      {topBanner !== null ? <div className={styles.divider}></div> : null}
      <ProfileInfo user={receiver} />
      <div className={styles.amountToSend}>
        <TokenAmountInput
          label={messages.inputLabel}
          placeholder={messages.inputPlaceholder}
          tokenLabel={messages.inputTokenLabel}
          value={tipAmount}
          isWhole
          onChange={handleTipAmountChange}
        />
      </div>
      {renderAvailableAmount()}
      <div className={cn(styles.flexCenter, styles.buttonContainer)}>
        <Button
          text={messages.sendATip}
          type={ButtonType.PRIMARY_ALT}
          onClick={handleSendClick}
          rightIcon={<IconArrow />}
          textClassName={styles.buttonText}
          className={cn(styles.buttonText, { [styles.disabled]: isDisabled })}
          disabled={isDisabled}
          iconClassName={styles.buttonIcon}
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
