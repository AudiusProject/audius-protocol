import { cloneElement, useCallback, useState } from 'react'

import { useAudioBalance } from '@audius/common/api'
import { BadgeTier, StringAudio, StringWei } from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import {
  tippingSelectors,
  tippingActions,
  getTierAndNumberForBalance,
  buyAudioActions,
  OnRampProvider
} from '@audius/common/store'
import { isNullOrUndefined } from '@audius/common/utils'
import { AUDIO, AudioWei } from '@audius/fixed-decimal'
import {
  IconQuestionCircle,
  IconArrowRight as IconArrow,
  TokenAmountInput,
  TokenAmountInputChangeHandler,
  Button,
  Flex
} from '@audius/harmony'
import cn from 'classnames'
import { useDispatch, useSelector } from 'react-redux'

import IconNoTierBadge from 'assets/img/tokenBadgePurple16@2x.webp'
import { OnRampButton } from 'components/on-ramp-button'
import Skeleton from 'components/skeleton/Skeleton'
import Tooltip from 'components/tooltip/Tooltip'
import { audioTierMap } from 'components/user-badges/UserBadges'
import { useFlag } from 'hooks/useRemoteConfig'

import { ProfileInfo } from '../../profile-info/ProfileInfo'

import { SupporterPrompt } from './SupporterPrompt'
import styles from './TipAudio.module.css'

const { getSendUser } = tippingSelectors
const { beginTip, resetSend, sendTip } = tippingActions
const { startBuyAudioFlow } = buyAudioActions

const messages = {
  availableToSend: 'AVAILABLE TO SEND',
  sendATip: 'Send Tip',
  enterAnAmount: 'Enter an amount',
  insufficientBalance: 'Insufficient Balance',
  tooltip: '$AUDIO held in linked wallets cannot be used for tipping',
  inputLabel: 'Amount to tip',
  inputPlaceholder: 'Enter an amount',
  inputTokenLabel: '$AUDIO',
  buyAudioPrefix: 'Buy $AUDIO using '
}

export const SendTip = () => {
  const dispatch = useDispatch()
  const receiver = useSelector(getSendUser)

  const { accountBalance: audioBalanceBigInt, isLoading: isBalanceLoading } =
    useAudioBalance({
      includeConnectedWallets: false
    })

  const accountBalance = audioBalanceBigInt ?? (BigInt(0) as AudioWei)

  const [tipAmount, setTipAmount] = useState('')
  const [tipAmountWei, setTipAmountWei] = useState<AudioWei>(
    BigInt(0) as AudioWei
  )

  const { tier } = getTierAndNumberForBalance(
    accountBalance.toString() as StringWei
  )
  const audioBadge = audioTierMap[tier as BadgeTier]

  const { isEnabled: isStripeBuyAudioEnabled } = useFlag(
    FeatureFlags.BUY_AUDIO_STRIPE_ENABLED
  )

  const handleTipAmountChange = useCallback<TokenAmountInputChangeHandler>(
    (value, valueBigInt) => {
      setTipAmount(value as StringAudio)
      setTipAmountWei(valueBigInt as AudioWei)
    },
    [setTipAmount, setTipAmountWei]
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

  const isDisabled =
    !tipAmount || tipAmountWei <= BigInt(0) || tipAmountWei > accountBalance
  const showBuyAudioButton = isStripeBuyAudioEnabled && isDisabled

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
          {isBalanceLoading || isNullOrUndefined(accountBalance) ? (
            <Skeleton width='20px' height='14px' />
          ) : (
            AUDIO(accountBalance).toLocaleString('en-US', {
              maximumFractionDigits: 0
            })
          )}
        </span>
      </div>
    </div>
  )

  return receiver ? (
    <Flex
      column
      justifyContent='space-between'
      alignItems='center'
      w='100%'
      h='100%'
    >
      <div
        className={cn(styles.container, {
          [styles.containerFill]: true,
          [styles.containerDense]: showBuyAudioButton
        })}
      >
        <SupporterPrompt receiverId={receiver.user_id} />
        {showBuyAudioButton ? (
          <>
            <OnRampButton
              buttonPrefix={messages.buyAudioPrefix}
              provider={OnRampProvider.STRIPE}
              css={(theme) => ({
                paddingVertical: theme.spacing.s
              })}
              onClick={handleBuyWithStripeClicked}
            />
            <div className={styles.divider} />
          </>
        ) : null}
        <ProfileInfo user={receiver} />
        <div className={styles.amountToSend}>
          <TokenAmountInput
            label={messages.inputLabel}
            placeholder={messages.inputPlaceholder}
            tokenLabel={messages.inputTokenLabel}
            value={tipAmount}
            decimals={18}
            onChange={handleTipAmountChange}
          />
        </div>
        {renderAvailableAmount()}
      </div>
      <Flex column w='100%' p='xl'>
        <Button
          variant='primary'
          onClick={handleSendClick}
          fullWidth
          iconRight={IconArrow}
          disabled={isDisabled}
        >
          {messages.sendATip}
        </Button>
        {isDisabled && tipAmount && (
          <div className={cn(styles.flexCenter, styles.error)}>
            {messages.insufficientBalance}
          </div>
        )}
      </Flex>
    </Flex>
  ) : null
}
