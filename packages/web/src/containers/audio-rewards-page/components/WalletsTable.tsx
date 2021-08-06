import React, { useCallback } from 'react'

import { LogoEth, LogoSol } from '@audius/stems'
import cn from 'classnames'
import { useDispatch } from 'react-redux'

import { ReactComponent as IconCopy } from 'assets/img/iconCopy.svg'
import { ReactComponent as IconRemove } from 'assets/img/iconRemoveTrack.svg'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import Toast from 'components/toast/Toast'
import { ComponentPlacement } from 'components/types'
import { useWithMobileStyle } from 'hooks/useWithMobileStyle'
import {
  getAssociatedWallets,
  requestRemoveWallet,
  getRemoveWallet,
  Chain
} from 'store/token-dashboard/slice'
import { BNWei } from 'store/wallet/slice'
import { copyToClipboard } from 'utils/clipboardUtil'
import { useSelector } from 'utils/reducer'

import DisplayAudio from './DisplayAudio'
import styles from './WalletsTable.module.css'

const COPIED_TOAST_TIMEOUT = 2000

const messages = {
  copied: 'Copied To Clipboard!',
  linkedWallets: 'LINKED WALLETS',
  collectibles: 'COLLECTIBLES',
  audio: '$AUDIO'
}

const shortenSPLAddress = (addr: string) => {
  return `${addr.substring(0, 4)}...${addr.substr(addr.length - 5)}`
}

const shortenEthAddress = (addr: string) => {
  return `0x${addr.substr(2, 4)}...${addr.substr(addr.length - 5)}`
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
  const dispatch = useDispatch()
  const onRequestRemoveWallet = useCallback(
    (e: React.MouseEvent) => {
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

  return (
    <div className={cn(styles.copyContainer)} onClick={copyAddressToClipboard}>
      <div className={styles.addressContainer}>
        <Toast
          text={messages.copied}
          disabled={isDisabled}
          requireAccount={false}
          delay={COPIED_TOAST_TIMEOUT}
          tooltipClassName={styles.copyTooltip}
          containerClassName={cn(styles.walletContainer, {
            [styles.removingWallet]: isConfirmRemoving,
            [styles.disabled]: isDisabled
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
            <IconCopy className={styles.iconCopy} />
          </>
        </Toast>
      </div>
      {!hideCollectibles && (
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
    errorMessage,
    connectedEthWallets: ethWallets,
    connectedSolWallets: solWallets
  } = useSelector(getAssociatedWallets)
  const removeWallets = useSelector(getRemoveWallet)

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
        {!hideCollectibles && (
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
      {ethWallets &&
        ethWallets.map(wallet => (
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
      {solWallets &&
        solWallets.map(wallet => (
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
      {errorMessage && <div className={styles.error}>{errorMessage}</div>}
    </div>
  )
}

export default WalletsTable
