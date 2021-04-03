import React, { useCallback } from 'react'
import styles from './ConnectWalletsBody.module.css'
import cn from 'classnames'
import { Button, ButtonType } from '@audius/stems'
import { ReactComponent as IconCopy } from 'assets/img/iconCopy.svg'
import { ReactComponent as IconRemove } from 'assets/img/iconRemoveTrack.svg'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import { useSelector } from 'utils/reducer'
import {
  connectNewWallet,
  getAssociatedWallets,
  requestRemoveWallet,
  getRemoveWallet
} from 'store/token-dashboard/slice'
import { useDispatch } from 'react-redux'
import Toast from 'components/toast/Toast'
import { ComponentPlacement, MountPlacement } from 'components/types'
import { copyToClipboard } from 'utils/clipboardUtil'

const WALLET_COUNT_LIMIT = 5
const COPIED_TOAST_TIMEOUT = 2000

const messages = {
  title: 'Connect Additional Wallets With Your Account',
  description:
    'Show off your NFT Collectibles and flaunt your $AUDIO with a VIP badge on your profile.',
  connectBtn: 'Connect New Wallet',
  limit: `Reached Limit of ${WALLET_COUNT_LIMIT} Connected Wallets.`
}

type WalletProps = {
  className?: string
  address: string
  isDisabled: boolean
  isConfirmAdding: boolean
  isConfirmRemoving: boolean
}

const Wallet = ({
  address,
  isConfirmAdding,
  isConfirmRemoving,
  isDisabled
}: WalletProps) => {
  const dispatch = useDispatch()
  const onRequestRemoveWallet = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      dispatch(requestRemoveWallet({ wallet: address }))
    },
    [dispatch, address]
  )

  const copyAddressToClipboard = useCallback(() => {
    copyToClipboard(address)
  }, [address])

  return (
    <div className={styles.copyContainer} onClick={copyAddressToClipboard}>
      <Toast
        text={'Copied To Clipboard!'}
        disabled={isDisabled}
        requireAccount={false}
        delay={COPIED_TOAST_TIMEOUT}
        tooltipClassName={styles.copyTooltip}
        containerClassName={cn(styles.walletContainer, {
          [styles.removingWallet]: isConfirmRemoving,
          [styles.disabled]: isDisabled
        })}
        placement={ComponentPlacement.TOP}
        mount={MountPlacement.PARENT}
      >
        <>
          <div className={styles.addressContainer}>
            <span className={styles.address}>{address}</span>
            <IconCopy className={styles.iconCopy} />
          </div>
          {isConfirmAdding || isConfirmRemoving ? (
            <LoadingSpinner className={styles.loading}></LoadingSpinner>
          ) : (
            !isDisabled && (
              <div
                className={styles.removeContainer}
                onClick={onRequestRemoveWallet}
              >
                <IconRemove className={styles.iconRemove} />
              </div>
            )
          )}
        </>
      </Toast>
    </div>
  )
}

type ConnectWalletsBodyProps = {
  className?: string
}

const ConnectWalletsBody = ({ className }: ConnectWalletsBodyProps) => {
  const dispatch = useDispatch()

  const onConnectWallets = useCallback(() => {
    dispatch(connectNewWallet())
  }, [dispatch])

  const {
    status,
    confirmingWallet,
    errorMessage,
    connectedWallets: wallets
  } = useSelector(getAssociatedWallets)
  const removeWallets = useSelector(getRemoveWallet)
  const hasReachedLimit = !!wallets && wallets.length >= WALLET_COUNT_LIMIT

  const isDisabled =
    removeWallets.status === 'Confirming' ||
    status === 'Connecting' ||
    status === 'Confirming'
  const isConnectDisabled = hasReachedLimit || isDisabled
  return (
    <div className={cn(styles.container, { [className!]: !!className })}>
      <h4 className={styles.title}>{messages.title}</h4>
      <p className={styles.description}>{messages.description}</p>
      <Button
        className={cn(styles.connectBtn, {
          [styles.disabled]: isConnectDisabled
        })}
        textClassName={styles.connectBtnText}
        type={ButtonType.PRIMARY_ALT}
        text={messages.connectBtn}
        onClick={onConnectWallets}
        isDisabled={isConnectDisabled}
      />
      {hasReachedLimit && <p className={styles.limit}>{messages.limit}</p>}
      <div className={styles.walletsContainer}>
        {wallets &&
          wallets.map(wallet => (
            <Wallet
              key={wallet}
              address={wallet}
              isDisabled={isDisabled}
              isConfirmAdding={false}
              isConfirmRemoving={removeWallets.wallet === wallet}
            />
          ))}
        {confirmingWallet && (
          <Wallet
            address={confirmingWallet}
            isDisabled={true}
            isConfirmAdding
            isConfirmRemoving={false}
          />
        )}
        {errorMessage && <div className={styles.error}>{errorMessage}</div>}
      </div>
    </div>
  )
}

export default ConnectWalletsBody
