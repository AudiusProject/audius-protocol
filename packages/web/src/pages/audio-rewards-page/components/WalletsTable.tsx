import { useCallback, useContext, useEffect, MouseEvent } from 'react'

import {
  Chain,
  BNWei,
  shortenEthAddress,
  shortenSPLAddress,
  tokenDashboardPageActions,
  tokenDashboardPageSelectors
} from '@audius/common'
import { IconCopy, IconRemove, IconSolana as LogoSol } from '@audius/harmony'
import { LogoEth } from '@audius/stems'
import cn from 'classnames'
import { useDispatch } from 'react-redux'

import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import Toast from 'components/toast/Toast'
import { ToastContext } from 'components/toast/ToastContext'
import { ComponentPlacement, MountPlacement } from 'components/types'
import { useIsMobile } from 'hooks/useIsMobile'
import { useWithMobileStyle } from 'hooks/useWithMobileStyle'
import { copyToClipboard } from 'utils/clipboardUtil'
import { NEW_WALLET_CONNECTED_TOAST_TIMEOUT_MILLIS } from 'utils/constants'
import { useSelector } from 'utils/reducer'

import DisplayAudio from './DisplayAudio'
import styles from './WalletsTable.module.css'
const { getAssociatedWallets, getRemoveWallet } = tokenDashboardPageSelectors
const { requestRemoveWallet, resetStatus } = tokenDashboardPageActions

const COPIED_TOAST_TIMEOUT = 2000

const messages = {
  copied: 'Copied To Clipboard!',
  newWalletConnected: 'New Wallet Successfully Connected!',
  linkedWallets: 'LINKED WALLETS',
  collectibles: 'COLLECTIBLES',
  audio: '$AUDIO'
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
  hideCollectibles?: boolean
}

const Wallet = ({
  chain,
  address,
  isConfirmAdding,
  isConfirmRemoving,
  collectibleCount,
  audioBalance,
  isDisabled,
  hasActions,
  hideCollectibles
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
  const copyAddressToClipboard = useCallback(() => {
    copyToClipboard(address)
  }, [address])
  const isCopyDisabled = isConfirmAdding || isConfirmRemoving
  return (
    <div className={cn(styles.copyContainer)} onClick={copyAddressToClipboard}>
      <div className={styles.addressContainer}>
        <Toast
          text={messages.copied}
          mount={MountPlacement.PARENT}
          disabled={isCopyDisabled}
          requireAccount={false}
          delay={COPIED_TOAST_TIMEOUT}
          tooltipClassName={styles.copyTooltip}
          containerClassName={cn(styles.walletContainer, {
            [styles.removingWallet]: isConfirmRemoving,
            [styles.disabled]: isCopyDisabled
          })}
          placement={ComponentPlacement.TOP}
        >
          <>
            <div className={styles.chainIconContainer}>
              {chain === Chain.Eth ? (
                <LogoEth className={styles.chainIconEth} />
              ) : (
                <LogoSol className={styles.chainIconSol} />
              )}
            </div>
            <span className={styles.walletText}>{displayAddress(address)}</span>
            {!isCopyDisabled && <IconCopy className={styles.iconCopy} />}
          </>
        </Toast>
      </div>
      {!hideCollectibles && !isMobile && (
        <div className={cn(styles.collectibleCount, styles.walletText)}>
          {collectibleCount}
        </div>
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
      {hasActions && !(isConfirmAdding || isConfirmRemoving) && !isDisabled && (
        <div className={styles.removeContainer} onClick={onRequestRemoveWallet}>
          <IconRemove className={styles.iconRemove} />
        </div>
      )}
      {hasActions && !(isConfirmAdding || isConfirmRemoving) && isDisabled && (
        <div className={styles.actionSpacing} />
      )}
    </div>
  )
}

type WalletsTableProps = {
  className?: string
  hasActions?: boolean
  hideCollectibles?: boolean
}

const WalletsTable = ({
  hasActions = false,
  className,
  hideCollectibles
}: WalletsTableProps) => {
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
        [styles.noActions]: !hasActions,
        [styles.hideCollectibles]: hideCollectibles
      })}
    >
      <div className={styles.walletsHeader}>
        <h6 className={cn(styles.walletsHeaderItem, styles.headerWallet)}>
          {messages.linkedWallets}
        </h6>
        {!hideCollectibles && !isMobile && (
          <h6
            className={cn(styles.walletsHeaderItem, styles.headerCollectibles)}
          >
            {messages.collectibles}
          </h6>
        )}
        <h6 className={cn(styles.walletsHeaderItem, styles.headerAudio)}>
          {messages.audio}
        </h6>
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
          hideCollectibles={hideCollectibles}
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
          hideCollectibles={hideCollectibles}
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
          hideCollectibles={hideCollectibles}
          isConfirmRemoving={false}
        />
      )}
    </div>
  )
}

export default WalletsTable
