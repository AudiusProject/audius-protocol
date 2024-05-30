import { useCallback, useContext, useEffect, MouseEvent, useMemo } from 'react'

import { Chain, BNWei } from '@audius/common/models'
import {
  tokenDashboardPageSelectors,
  tokenDashboardPageActions
} from '@audius/common/store'
import { shortenSPLAddress, shortenEthAddress } from '@audius/common/utils'
import {
  IconCopy,
  IconLogoCircleETH,
  IconLogoCircleSOL,
  Text,
  PopupMenu,
  PopupMenuItem,
  IconTrash,
  IconButton,
  IconKebabHorizontal,
  Flex
} from '@audius/harmony'
import cn from 'classnames'
import { useDispatch } from 'react-redux'

import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import { ToastContext } from 'components/toast/ToastContext'
import { useIsMobile } from 'hooks/useIsMobile'
import { useWithMobileStyle } from 'hooks/useWithMobileStyle'
import { copyToClipboard } from 'utils/clipboardUtil'
import { NEW_WALLET_CONNECTED_TOAST_TIMEOUT_MILLIS } from 'utils/constants'
import { useSelector } from 'utils/reducer'

import { WALLET_COUNT_LIMIT } from './ConnectWalletsBody'
import DisplayAudio from './DisplayAudio'
import styles from './WalletsTable.module.css'
const { getAssociatedWallets, getRemoveWallet } = tokenDashboardPageSelectors
const { requestRemoveWallet, resetStatus } = tokenDashboardPageActions

const COPIED_TOAST_TIMEOUT = 2000

const messages = {
  copied: 'Copied To Clipboard!',
  newWalletConnected: 'New Wallet Successfully Connected!',
  collectibles: 'COLLECTIBLES',
  audio: '$AUDIO',
  copy: 'Copy Wallet Address',
  remove: 'Remove Wallet',
  options: 'Options'
}

type WalletProps = {
  className?: string
  chain: Chain
  address: string
  collectibleCount: number
  audioBalance: BNWei
  isDisabled: boolean
  isConfirmAdding: boolean
  isConfirmRemoving: boolean
  hasActions: boolean
}

const Wallet = ({
  chain,
  address,
  isConfirmAdding,
  isConfirmRemoving,
  collectibleCount,
  audioBalance,
  isDisabled,
  hasActions
}: WalletProps) => {
  const isMobile = useIsMobile()
  const dispatch = useDispatch()
  const onRequestRemoveWallet = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation()
      dispatch(requestRemoveWallet({ wallet: address, chain }))
    },
    [dispatch, address, chain]
  )
  const displayAddress =
    chain === Chain.Eth ? shortenEthAddress : shortenSPLAddress
  const { toast } = useContext(ToastContext)
  const copyAddressToClipboard = useCallback(() => {
    copyToClipboard(address)
    toast(messages.copied, COPIED_TOAST_TIMEOUT)
  }, [address, toast])
  const isCopyDisabled = isConfirmAdding || isConfirmRemoving
  const items: PopupMenuItem[] = useMemo(
    () =>
      [
        !isCopyDisabled
          ? {
              text: messages.copy,
              icon: <IconCopy />,
              onClick: copyAddressToClipboard
            }
          : null,
        {
          text: messages.remove,
          icon: <IconTrash />,
          onClick: onRequestRemoveWallet
        }
      ].filter(Boolean) as PopupMenuItem[],
    [isCopyDisabled, onRequestRemoveWallet, copyAddressToClipboard]
  )

  return (
    <div className={cn(styles.copyContainer)}>
      <Flex alignItems='center' gap='s'>
        <>
          {chain === Chain.Eth ? <IconLogoCircleETH /> : <IconLogoCircleSOL />}
          <Text variant='body' size='m' strength='strong'>
            {displayAddress(address)}
          </Text>
          {/* <span className={styles.walletText}>{displayAddress(address)}</span> */}
        </>
      </Flex>
      {!isMobile && (
        <Text
          variant='body'
          size='m'
          strength='strong'
          css={{ flex: 1, textAlign: 'right' }}
        >
          {collectibleCount}
        </Text>
      )}
      <div className={cn(styles.audioBalance, styles.walletText)}>
        <DisplayAudio
          showLabel={false}
          amount={audioBalance}
          className={styles.balanceContainer}
          tokenClassName={styles.balance}
        />
      </div>
      {hasActions && (isConfirmAdding || isConfirmRemoving) && (
        <LoadingSpinner className={styles.loading}></LoadingSpinner>
      )}
      <Flex pl='l' css={{ marginLeft: 'auto', flexBasis: 0 }}>
        {hasActions &&
          !(isConfirmAdding || isConfirmRemoving) &&
          !isDisabled && (
            <PopupMenu
              items={items}
              renderTrigger={(ref, trigger) => (
                <IconButton
                  ref={ref}
                  icon={IconKebabHorizontal}
                  size='s'
                  color='subdued'
                  onClick={() => trigger()}
                  aria-label={messages.options}
                />
              )}
            />
          )}
      </Flex>
    </div>
  )
}

type WalletsTableProps = {
  className?: string
  hasActions?: boolean
}

const WalletsTable = ({ hasActions = false, className }: WalletsTableProps) => {
  const {
    status,
    confirmingWallet,
    connectedEthWallets: ethWallets,
    connectedSolWallets: solWallets
  } = useSelector(getAssociatedWallets)

  const { toast } = useContext(ToastContext)
  const dispatch = useDispatch()
  useEffect(() => {
    if (status === 'Confirmed') {
      const timeout = NEW_WALLET_CONNECTED_TOAST_TIMEOUT_MILLIS
      toast(messages.newWalletConnected, timeout)
      setTimeout(() => {
        dispatch(resetStatus())
      }, timeout)

      return () => {
        dispatch(resetStatus())
      }
    }
  }, [toast, dispatch, status])

  const removeWallets = useSelector(getRemoveWallet)

  const isMobile = useIsMobile()
  const wm = useWithMobileStyle(styles.mobile)

  const isDisabled =
    removeWallets.status === 'Confirming' ||
    status === 'Connecting' ||
    status === 'Confirming'

  const showConfirmingWallet =
    hasActions &&
    confirmingWallet.wallet !== null &&
    confirmingWallet.chain !== null &&
    confirmingWallet.balance !== null &&
    confirmingWallet.collectibleCount !== null

  return (
    <div
      className={wm(styles.container, {
        [className!]: !!className,
        [styles.noActions]: !hasActions
      })}
    >
      <div className={styles.walletsHeader}>
        <Text variant='label' size='m' strength='strong' color='subdued'>
          {`(${
            (ethWallets?.length ?? 0) + (solWallets?.length ?? 0)
          }/${WALLET_COUNT_LIMIT})`}
        </Text>
        {!isMobile && (
          <Text variant='label' size='m' strength='strong' color='subdued'>
            {messages.collectibles}
          </Text>
        )}
        <Text variant='label' size='m' strength='strong' color='subdued'>
          {messages.audio}
        </Text>
      </div>
      {ethWallets?.map((wallet) => (
        <Wallet
          chain={Chain.Eth}
          key={wallet.address}
          address={wallet.address}
          collectibleCount={wallet.collectibleCount}
          audioBalance={wallet.balance}
          isDisabled={isDisabled}
          isConfirmAdding={false}
          hasActions={hasActions}
          isConfirmRemoving={removeWallets.wallet === wallet.address}
        />
      ))}
      {solWallets?.map((wallet) => (
        <Wallet
          chain={Chain.Sol}
          key={wallet.address}
          address={wallet.address}
          collectibleCount={wallet.collectibleCount}
          audioBalance={wallet.balance}
          isDisabled={isDisabled}
          hasActions={hasActions}
          isConfirmAdding={false}
          isConfirmRemoving={removeWallets.wallet === wallet.address}
        />
      ))}
      {showConfirmingWallet && (
        <Wallet
          chain={confirmingWallet.chain!}
          address={confirmingWallet.wallet!}
          collectibleCount={confirmingWallet.collectibleCount!}
          audioBalance={confirmingWallet.balance!}
          isDisabled
          hasActions
          isConfirmAdding
          isConfirmRemoving={false}
        />
      )}
    </div>
  )
}

export default WalletsTable
