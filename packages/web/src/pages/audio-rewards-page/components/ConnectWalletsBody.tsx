import { useCallback } from 'react'

import {
  tokenDashboardPageSelectors,
  tokenDashboardPageActions
} from '@audius/common/store'
import { Button, ButtonType } from '@audius/stems'
import cn from 'classnames'
import { useDispatch } from 'react-redux'

import { useSelector } from 'utils/reducer'

import styles from './ConnectWalletsBody.module.css'
import WalletsTable from './WalletsTable'
const { getAssociatedWallets, getRemoveWallet } = tokenDashboardPageSelectors
const { connectNewWallet } = tokenDashboardPageActions

const WALLET_COUNT_LIMIT = 5

const messages = {
  title: 'Connect Additional Wallets With Your Account',
  description:
    'Show off your NFT Collectibles and flaunt your $AUDIO with a VIP badge on your profile.',
  connectBtn: 'Connect New Wallet',
  limit: `Reached Limit of ${WALLET_COUNT_LIMIT} Connected Wallets.`
}

type ConnectWalletsBodyProps = {
  className?: string
}

const ConnectWalletsBody = ({ className }: ConnectWalletsBodyProps) => {
  const dispatch = useDispatch()

  const onConnectWallets = useCallback(() => {
    dispatch(connectNewWallet())
  }, [dispatch])

  const { errorMessage } = useSelector(getAssociatedWallets)

  const {
    status,
    confirmingWallet,
    connectedEthWallets: ethWallets,
    connectedSolWallets: solWallets
  } = useSelector(getAssociatedWallets)
  // TODO C-3163 - Add loading state for loading associated wallets. Currently behaves as if you have no associated wallets until loading is finished.
  const removeWallets = useSelector(getRemoveWallet)
  const numConnectedWallets =
    (ethWallets?.length ?? 0) + (solWallets?.length ?? 0)
  const hasReachedLimit = numConnectedWallets >= WALLET_COUNT_LIMIT

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
      {(numConnectedWallets > 0 || Boolean(confirmingWallet.wallet)) && (
        <WalletsTable
          className={styles.walletsContainer}
          hasActions
          hideCollectibles
        />
      )}
      {errorMessage && <div className={styles.error}>{errorMessage}</div>}
    </div>
  )
}

export default ConnectWalletsBody
