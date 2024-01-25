import { useCallback, useContext, useEffect, useMemo } from 'react'

import {
  BNWei,
  tokenDashboardPageActions,
  walletSelectors,
  tokenDashboardPageSelectors,
  formatWei,
  buyAudioActions,
  OnRampProvider,
  FeatureFlags,
  StringKeys,
  Client,
  Location,
  isNullOrUndefined
} from '@audius/common'
import { Button, ButtonType, IconInfo } from '@audius/stems'
import BN from 'bn.js'
import cn from 'classnames'
import { push as pushRoute } from 'connected-react-router'
import { useDispatch, useSelector } from 'react-redux'
import { useAsync } from 'react-use'

import IconReceive from 'assets/img/iconReceive.svg'
import IconSend from 'assets/img/iconSend.svg'
import IconSettings from 'assets/img/iconSettings.svg'
import IconTransaction from 'assets/img/iconTransaction.svg'
import IconGoldBadge from 'assets/img/tokenBadgeGold40@2x.png'
import { useModalState } from 'common/hooks/useModalState'
import { isMobileWeb } from 'common/utils/isMobileWeb'
import { CollapsibleContent } from 'components/collapsible-content'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import MobileConnectWalletsDrawer from 'components/mobile-connect-wallets-drawer/MobileConnectWalletsDrawer'
import { OnRampButton } from 'components/on-ramp-button/OnRampButton'
import { ToastContext } from 'components/toast/ToastContext'
import Tooltip from 'components/tooltip/Tooltip'
import { useFlag, useRemoteVar } from 'hooks/useRemoteConfig'
import { getLocation } from 'services/Location'
import { isMobile, getClient } from 'utils/clientUtil'
import {
  AUDIO_TRANSACTIONS_PAGE,
  pushUniqueRoute,
  TRENDING_PAGE
} from 'utils/route'

import TokenHoverTooltip from './TokenHoverTooltip'
import styles from './WalletManagementTile.module.css'
const { getHasAssociatedWallets } = tokenDashboardPageSelectors
const { pressReceive, pressSend, pressConnectWallets } =
  tokenDashboardPageActions
const {
  getAccountBalance,
  getAccountTotalBalance,
  getTotalBalanceLoadDidFail
} = walletSelectors
const { startBuyAudioFlow } = buyAudioActions

const messages = {
  receiveLabel: 'Receive',
  sendLabel: 'Send',
  transactionsLabel: 'View Transactions',
  audio: '$AUDIO',
  manageWallets: 'Manage Wallets',
  buyAudio: 'Buy $AUDIO',
  buyAudioSubheader:
    'Buy $Audio tokens to unlock VIP tiers, earn badges, and tip artists',
  showAdvanced: 'Show More Options',
  hideAdvanced: 'Hide More Options',
  additionalPaymentMethods: 'Additional Payment Methods',
  advancedOptions: 'Advanced Options',
  stripeRegionNotSupported:
    'Link by Stripe is not yet supported in your region',
  coinbasePayRegionNotSupported:
    'Coinbase Pay is not yet supported in your region',
  stripeStateNotSupported: (state: string) =>
    `Link by Stripe is not supported in the state of ${state}`,
  coinbaseStateNotSupported: (state: string) =>
    `Coinbase Pay is not supported in the state of ${state}`,
  goldAudioToken: 'Gold $AUDIO token',
  findArtists: 'Find Artists to Support on Trending'
}

const AdvancedWalletActions = () => {
  const balance = useSelector(getAccountBalance) ?? (new BN(0) as BNWei)
  const hasBalance = !isNullOrUndefined(balance) && !balance.isZero()
  const dispatch = useDispatch()
  const [, openTransferDrawer] = useModalState('TransferAudioMobileWarning')

  const mobile = isMobile()
  const { isEnabled: isTransactionsEnabled } = useFlag(
    FeatureFlags.AUDIO_TRANSACTIONS_HISTORY
  )
  const onClickReceive = useCallback(() => {
    if (mobile) {
      openTransferDrawer(true)
    } else {
      dispatch(pressReceive())
    }
  }, [dispatch, mobile, openTransferDrawer])

  const onClickSend = useCallback(() => {
    if (mobile) {
      openTransferDrawer(true)
    } else {
      dispatch(pressSend())
    }
  }, [mobile, dispatch, openTransferDrawer])
  const [, setOpen] = useModalState('MobileConnectWalletsDrawer')

  const onClickTransactions = useCallback(() => {
    dispatch(pushRoute(AUDIO_TRANSACTIONS_PAGE))
  }, [dispatch])

  const onClickConnectWallets = useCallback(() => {
    if (mobile) {
      setOpen(true)
    } else {
      dispatch(pressConnectWallets())
    }
  }, [mobile, setOpen, dispatch])

  const onCloseConnectWalletsDrawer = useCallback(() => {
    setOpen(false)
  }, [setOpen])

  return (
    <div className={styles.moreOptionsSection}>
      <div className={styles.subtitle}>{messages.advancedOptions}</div>
      <div className={styles.advancedOptions}>
        <Button
          className={cn(styles.advancedButton, {
            [styles.disabled]: !hasBalance
          })}
          text={messages.sendLabel}
          isDisabled={!hasBalance}
          includeHoverAnimations={hasBalance}
          textClassName={styles.textClassName}
          onClick={onClickSend}
          leftIcon={<IconSend className={styles.iconStyle} />}
          type={ButtonType.GLASS}
          minWidth={200}
        />
        <Button
          className={cn(styles.advancedButton)}
          text={messages.receiveLabel}
          textClassName={styles.textClassName}
          onClick={onClickReceive}
          leftIcon={<IconReceive className={styles.iconStyle} />}
          type={ButtonType.GLASS}
          minWidth={200}
        />
        {!mobile && isTransactionsEnabled && (
          <Button
            className={cn(styles.advancedButton)}
            text={messages.transactionsLabel}
            textClassName={styles.textClassName}
            onClick={onClickTransactions}
            leftIcon={<IconTransaction className={styles.iconStyle} />}
            type={ButtonType.GLASS}
            minWidth={200}
          />
        )}
        <Button
          className={cn(styles.advancedButton, styles.manageWalletsButton)}
          text={messages.manageWallets}
          includeHoverAnimations
          textClassName={styles.textClassName}
          onClick={onClickConnectWallets}
          type={ButtonType.GLASS}
          leftIcon={<IconSettings className={styles.iconStyle} />}
          minWidth={200}
        />
        {mobile && (
          <MobileConnectWalletsDrawer onClose={onCloseConnectWalletsDrawer} />
        )}
      </div>
    </div>
  )
}

type OnRampTooltipButtonProps = {
  provider: OnRampProvider
  isDisabled: boolean
  bannedState: string | boolean
}

const OnRampTooltipButton = ({
  provider,
  isDisabled,
  bannedState
}: OnRampTooltipButtonProps) => {
  const dispatch = useDispatch()
  const onClick = useCallback(() => {
    dispatch(
      startBuyAudioFlow({
        provider,
        onSuccess: {
          action: pushUniqueRoute(TRENDING_PAGE),
          message: messages.findArtists
        }
      })
    )
  }, [dispatch, provider])
  const bannedRegionText =
    provider === OnRampProvider.COINBASE
      ? messages.coinbasePayRegionNotSupported
      : messages.stripeRegionNotSupported
  const disabledText =
    typeof bannedState === 'string'
      ? provider === OnRampProvider.COINBASE
        ? messages.coinbaseStateNotSupported(bannedState)
        : messages.stripeStateNotSupported(bannedState)
      : bannedRegionText
  return (
    <Tooltip
      disabled={!isDisabled}
      className={styles.tooltip}
      text={disabledText}
      color={'--secondary'}
      shouldWrapContent={false}
    >
      <div className={styles.onRampButtonTooltipContainer}>
        <OnRampButton
          provider={provider}
          className={styles.onRampButton}
          disabled={isDisabled}
          isDisabled={isDisabled}
          onClick={onClick}
        />
      </div>
    </Tooltip>
  )
}

const isLocationSupported = ({
  location,
  allowedCountries,
  deniedRegions
}: {
  location?: Location | null
  allowedCountries: string[]
  deniedRegions: string[]
}) => {
  return (
    !location ||
    (allowedCountries.some((c) => c === location.country_code) &&
      !deniedRegions.some((r) => r === location.region_code))
  )
}

const useOnRampProviderInfo = () => {
  const { isEnabled: isCoinbaseEnabled } = useFlag(
    FeatureFlags.BUY_AUDIO_COINBASE_ENABLED
  )
  const { isEnabled: isStripeEnabled } = useFlag(
    FeatureFlags.BUY_AUDIO_STRIPE_ENABLED
  )
  const coinbaseAllowedCountries = (
    useRemoteVar(StringKeys.COINBASE_PAY_ALLOWED_COUNTRIES_2_LETTER) ?? ''
  ).split(',')
  const coinbaseDeniedRegions = (
    useRemoteVar(StringKeys.COINBASE_PAY_DENIED_REGIONS) ?? ''
  ).split(',')
  const stripeAllowedCountries = (
    useRemoteVar(StringKeys.STRIPE_ALLOWED_COUNTRIES_2_LETTER) ?? ''
  ).split(',')
  const stripeDeniedRegions = (
    useRemoteVar(StringKeys.STRIPE_DENIED_REGIONS) ?? ''
  ).split(',')

  const { value } = useAsync(getLocation, [])

  const isCoinbaseAllowed = useMemo(
    () =>
      isLocationSupported({
        location: value,
        allowedCountries: coinbaseAllowedCountries,
        deniedRegions: coinbaseDeniedRegions
      }),
    [value, coinbaseAllowedCountries, coinbaseDeniedRegions]
  )
  const isStripeAllowed = useMemo(
    () =>
      isLocationSupported({
        location: value,
        allowedCountries: stripeAllowedCountries,
        deniedRegions: stripeDeniedRegions
      }),
    [value, stripeAllowedCountries, stripeDeniedRegions]
  )
  // Assume USA is supported, so if in USA but still not supported, it's a state ban
  const isState = value && value.country_code === 'US'

  return {
    [OnRampProvider.STRIPE]: {
      isEnabled: isStripeEnabled,
      isAllowed: isStripeAllowed,
      bannedState: isState && !isStripeAllowed ? value.region_code : false
    },
    [OnRampProvider.COINBASE]: {
      isEnabled: isCoinbaseEnabled && getClient() !== Client.ELECTRON,
      isAllowed: isCoinbaseAllowed,
      bannedState: isState && !isCoinbaseAllowed ? value.region_code : false
    }
  }
}

export const WalletManagementTile = () => {
  const totalBalance = useSelector(getAccountTotalBalance)
  const hasMultipleWallets = useSelector(getHasAssociatedWallets)
  const balanceLoadDidFail = useSelector(getTotalBalanceLoadDidFail)
  const { toast } = useContext(ToastContext)
  const [, setOpen] = useModalState('AudioBreakdown')

  const onRampProviders = useOnRampProviderInfo()
  const isStripeEnabled = onRampProviders[OnRampProvider.STRIPE].isEnabled
  const isCoinbaseEnabled = onRampProviders[OnRampProvider.COINBASE].isEnabled
  const primaryProvider =
    (!onRampProviders[OnRampProvider.STRIPE].isAllowed || !isStripeEnabled) &&
    onRampProviders[OnRampProvider.COINBASE].isAllowed &&
    isCoinbaseEnabled
      ? OnRampProvider.COINBASE
      : OnRampProvider.STRIPE
  const secondaryProvider =
    primaryProvider === OnRampProvider.COINBASE
      ? OnRampProvider.STRIPE
      : OnRampProvider.COINBASE
  const isAnyProviderAllowed =
    onRampProviders[primaryProvider].isAllowed ||
    onRampProviders[secondaryProvider].isAllowed

  const onClickOpen = useCallback(() => {
    setOpen(true)
  }, [setOpen])

  useEffect(() => {
    if (balanceLoadDidFail) {
      toast(
        'Could not load your $AUDIO balance. Please try again later.',
        10000
      )
    }
  }, [balanceLoadDidFail, toast])

  return (
    <div className={styles.walletManagementTile}>
      <div className={styles.balanceContainer}>
        {isNullOrUndefined(totalBalance) ? (
          <LoadingSpinner className={styles.spinner} />
        ) : (
          <TokenHoverTooltip balance={totalBalance}>
            <div className={styles.balanceAmount}>
              {formatWei(totalBalance, true, 0)}
            </div>
          </TokenHoverTooltip>
        )}
        <div className={styles.balance}>
          {hasMultipleWallets ? (
            <div onClick={onClickOpen}>
              {messages.audio}
              <IconInfo className={styles.iconInfo} />
            </div>
          ) : (
            messages.audio
          )}
        </div>
      </div>
      <div className={styles.container}>
        {!isMobileWeb() && isAnyProviderAllowed ? (
          <>
            <div className={styles.header}>
              <img
                className={styles.headerIcon}
                src={IconGoldBadge}
                alt={messages.goldAudioToken}
              />
              <div className={styles.headerText}>
                <div className={styles.title}>{messages.buyAudio}</div>
                <div className={styles.subtitle}>
                  {messages.buyAudioSubheader}
                </div>
              </div>
            </div>
            <div className={styles.onRampButtons}>
              {onRampProviders[primaryProvider].isEnabled ? (
                <OnRampTooltipButton
                  provider={primaryProvider}
                  isDisabled={!onRampProviders[primaryProvider].isAllowed}
                  bannedState={onRampProviders[primaryProvider].bannedState}
                />
              ) : null}
            </div>
          </>
        ) : null}
        <CollapsibleContent
          id='advanced-wallet-actions'
          className={styles.toggle}
          toggleButtonClassName={styles.advancedToggle}
          showText={messages.showAdvanced}
          hideText={messages.hideAdvanced}
        >
          <div className={styles.moreOptions}>
            {onRampProviders[secondaryProvider].isEnabled &&
            isAnyProviderAllowed ? (
              <div className={styles.moreOptionsSection}>
                <div className={styles.subtitle}>
                  {messages.additionalPaymentMethods}
                </div>
                <OnRampTooltipButton
                  provider={secondaryProvider}
                  isDisabled={!onRampProviders[secondaryProvider].isAllowed}
                  bannedState={onRampProviders[secondaryProvider].bannedState}
                />
              </div>
            ) : null}
            <AdvancedWalletActions />
          </div>
        </CollapsibleContent>
      </div>
    </div>
  )
}
