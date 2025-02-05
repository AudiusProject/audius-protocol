import { Name } from '@audius/common/models'
import {
  tokenDashboardPageActions,
  getContext,
  accountSelectors
} from '@audius/common/store'
import { captureException } from '@sentry/browser'
import { fork, put, select, takeEvery } from 'typed-redux-saga'

import { addWalletToUser } from 'common/store/pages/token-dashboard/addWalletToUser'
import { checkIsNewWallet } from 'common/store/pages/token-dashboard/checkIsNewWallet'
import { getWalletInfo } from 'common/store/pages/token-dashboard/getWalletInfo'
import {
  fetchEthereumCollectibles,
  fetchSolanaCollectibles
} from 'common/store/profile/sagas'

import { disconnectWallet } from './disconnectWallet'
import { establishWalletConnection } from './establishWalletConnection'
import { getWalletAddress } from './getWalletAddress'
import { signMessage } from './signMessage'

const { connectNewWallet } = tokenDashboardPageActions

const { setIsConnectingWallet, setModalState, resetStatus } =
  tokenDashboardPageActions

function* handleConnectNewWallet() {
  const analytics = yield* getContext('analytics')

  try {
    analytics.track({ eventName: Name.CONNECT_WALLET_NEW_WALLET_START })

    const connection = yield* establishWalletConnection()
    if (!connection) return

    const { chain } = connection

    const walletAddress = yield* getWalletAddress(connection)
    if (!walletAddress) return

    const isNewWallet = yield* checkIsNewWallet(walletAddress, chain)
    if (!isNewWallet) return

    const { balance, collectibleCount } = yield* getWalletInfo(
      walletAddress,
      chain
    )

    yield* put(
      setIsConnectingWallet({
        wallet: walletAddress,
        chain,
        balance,
        collectibleCount
      })
    )

    analytics.track({
      eventName: Name.CONNECT_WALLET_NEW_WALLET_CONNECTING,
      properties: {
        chain,
        walletAddress
      }
    })

    const signature = yield* signMessage(connection)

    analytics.track({
      eventName: Name.CONNECT_WALLET_NEW_WALLET_CONNECTED,
      properties: {
        chain,
        walletAddress
      }
    })

    const disconnect = () => disconnectWallet(connection)

    yield* addWalletToUser({ walletAddress, chain, signature }, disconnect)

    const user = yield* select(accountSelectors.getAccountUser)

    yield* fork(fetchSolanaCollectibles, user)
    yield* fork(fetchEthereumCollectibles, user)
  } catch (e) {
    // Very likely we hit error path here i.e. user closes the web3 popup. Log it and restart
    const err = `Caught error during handleConnectNewWallet:  ${e}, resetting to initial state`
    console.warn(err)
    captureException(err)
    yield* put(
      setModalState({
        modalState: {
          stage: 'CONNECT_WALLETS',
          flowState: { stage: 'ADD_WALLET' }
        }
      })
    )
    yield* put(resetStatus())

    analytics.track({
      eventName: Name.CONNECT_WALLET_ERROR,
      properties: {
        error: err
      }
    })
  }
}

export function* watchConnectNewWallet() {
  yield* takeEvery(connectNewWallet.type, handleConnectNewWallet)
}
