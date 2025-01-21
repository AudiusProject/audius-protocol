import { useCallback, useContext, useEffect, useMemo } from 'react'

import { useIsManagedAccount } from '@audius/common/hooks'
import { Client, BNWei } from '@audius/common/models'
import { StringKeys, FeatureFlags, Location } from '@audius/common/services'
import {
  tokenDashboardPageSelectors,
  tokenDashboardPageActions,
  walletSelectors,
  buyAudioActions,
  OnRampProvider
} from '@audius/common/store'
import { isNullOrUndefined, formatWei, route } from '@audius/common/utils'
import {
  IconReceive,
  IconSend,
  IconTransaction,
  IconInfo,
  Button,
  Flex,
  ButtonProps,
  IconLogoLinkByStripe,
  IconLogoCoinbasePay,
  Text,
  IconWallet,
  Box
} from '@audius/harmony'
import BN from 'bn.js'
import { useDispatch, useSelector } from 'react-redux'
import { useAsync } from 'react-use'

import { useHistoryContext } from 'app/HistoryProvider'
import { useModalState } from 'common/hooks/useModalState'
import { isMobileWeb } from 'common/utils/isMobileWeb'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import MobileConnectWalletsDrawer from 'components/mobile-connect-wallets-drawer/MobileConnectWalletsDrawer'
import { ToastContext } from 'components/toast/ToastContext'
import Tooltip from 'components/tooltip/Tooltip'
import { useIsMobile } from 'hooks/useIsMobile'
import { useFlag, useRemoteVar } from 'hooks/useRemoteConfig'
import { getLocation } from 'services/Location'
import { getClient } from 'utils/clientUtil'
import { push as pushRoute } from 'utils/navigation'
import { pushUniqueRoute } from 'utils/route'

import TokenHoverTooltip from './TokenHoverTooltip'
import styles from './WalletManagementTile.module.css'
const { AUDIO_TRANSACTIONS_PAGE, TRENDING_PAGE } = route
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
  audio: 'Total $AUDIO',
  connectedWallets: 'Connected Wallets',
  buyAudio: 'Buy $AUDIO Tokens',
  buyAudioNotSupported: 'Buy $AUDIO is not yet supported in your region',
  findArtists: 'Find Artists to Support on Trending',
  onRampsPowered: 'Onramps powered by'
}

const OptionButton = (props: ButtonProps) => {
  return (
    <Button
      variant='secondary'
      size='small'
      minWidth={150}
      fullWidth
      {...props}
    />
  )
}

const WalletActions = () => {
  const balance = useSelector(getAccountBalance) ?? (new BN(0) as BNWei)
  const hasBalance = !isNullOrUndefined(balance) && !balance.isZero()
  const dispatch = useDispatch()
  const [, openTransferDrawer] = useModalState('TransferAudioMobileWarning')

  const isMobile = useIsMobile()
  const onClickReceive = useCallback(() => {
    if (isMobile) {
      openTransferDrawer(true)
    } else {
      dispatch(pressReceive())
    }
  }, [dispatch, isMobile, openTransferDrawer])

  const onClickSend = useCallback(() => {
    if (isMobile) {
      openTransferDrawer(true)
    } else {
      dispatch(pressSend())
    }
  }, [isMobile, dispatch, openTransferDrawer])
  const onClickTransactions = useCallback(() => {
    dispatch(pushRoute(AUDIO_TRANSACTIONS_PAGE))
  }, [dispatch])

  return (
    <Flex gap='m' wrap='wrap' justifyContent='center'>
      <Box flex={1}>
        <OptionButton
          disabled={!hasBalance}
          onClick={onClickSend}
          iconLeft={IconSend}
        >
          {messages.sendLabel}
        </OptionButton>
      </Box>
      <Box flex={1}>
        <OptionButton onClick={onClickReceive} iconLeft={IconReceive}>
          {messages.receiveLabel}
        </OptionButton>
      </Box>
      <Box flex={1}>
        <OptionButton onClick={onClickTransactions} iconLeft={IconTransaction}>
          {messages.transactionsLabel}
        </OptionButton>
      </Box>
      <Box flex={1}>
        <ManageWalletsButton />
      </Box>
    </Flex>
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
  const { history } = useHistoryContext()

  const onClick = useCallback(() => {
    dispatch(
      startBuyAudioFlow({
        provider,
        onSuccess: {
          action: pushUniqueRoute(history.location, TRENDING_PAGE),
          message: messages.findArtists
        }
      })
    )
  }, [dispatch, provider, history])
  const disabledText = messages.buyAudioNotSupported
  return (
    <Tooltip
      disabled={!isDisabled}
      className={styles.tooltip}
      text={disabledText}
      color='secondary'
      shouldWrapContent={false}
    >
      <div className={styles.onRampButtonTooltipContainer}>
        <Button
          disabled={isDisabled}
          variant='primary'
          fullWidth
          onClick={onClick}
        >
          {messages.buyAudio}
        </Button>
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

export const useOnRampProviderInfo = () => {
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

const ManageWalletsButton = () => {
  const dispatch = useDispatch()
  const isMobile = useIsMobile()
  const [, setOpenConnectWalletsDrawer] = useModalState(
    'MobileConnectWalletsDrawer'
  )

  const onClickConnectWallets = useCallback(() => {
    if (isMobile) {
      setOpenConnectWalletsDrawer(true)
    } else {
      dispatch(pressConnectWallets())
    }
  }, [isMobile, setOpenConnectWalletsDrawer, dispatch])

  const onCloseConnectWalletsDrawer = useCallback(() => {
    setOpenConnectWalletsDrawer(false)
  }, [setOpenConnectWalletsDrawer])

  return (
    <>
      <OptionButton onClick={onClickConnectWallets} iconLeft={IconWallet}>
        {messages.connectedWallets}
      </OptionButton>
      {isMobile && (
        <MobileConnectWalletsDrawer onClose={onCloseConnectWalletsDrawer} />
      )}
    </>
  )
}
export const WalletManagementTile = () => {
  const isManagedAccount = useIsManagedAccount()
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
        {!isManagedAccount &&
        !isMobileWeb() &&
        onRampProviders[primaryProvider].isEnabled ? (
          <OnRampTooltipButton
            provider={primaryProvider}
            isDisabled={!isAnyProviderAllowed}
            bannedState={onRampProviders[primaryProvider].bannedState}
          />
        ) : null}
        {!isManagedAccount ? (
          <>
            <WalletActions />

            <Flex
              alignItems='center'
              justifyContent='center'
              gap='xl'
              borderTop='default'
              pt='xl'
              pb='s'
            >
              <Text variant='label' size='s' strength='default' color='subdued'>
                {messages.onRampsPowered}
              </Text>
              <IconLogoLinkByStripe
                width={100}
                height={'100%'}
                color='subdued'
              />
              <IconLogoCoinbasePay
                width={100}
                height={'100%'}
                color='subdued'
              />
            </Flex>
          </>
        ) : null}
      </div>
    </div>
  )
}
