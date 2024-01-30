import { getContext, tokenDashboardPageActions } from '@audius/common'
import { Name } from '@audius/common/models'
import { captureException } from '@sentry/browser'
import { fork, put, takeEvery } from 'typed-redux-saga'

import { addWalletToUser } from 'common/store/pages/token-dashboard/addWalletToUser'
import { associateNewWallet } from 'common/store/pages/token-dashboard/associateNewWallet'
import { checkIsNewWallet } from 'common/store/pages/token-dashboard/checkIsNewWallet'
import { getWalletInfo } from 'common/store/pages/token-dashboard/getWalletInfo'
import {
  fetchOpenSeaAssets,
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
    const updatedUserMetadata = yield* associateNewWallet(signature)

    analytics.track({
      eventName: Name.CONNECT_WALLET_NEW_WALLET_CONNECTED,
      properties: {
        chain,
        walletAddress
      }
    })

    const disconnect = () => disconnectWallet(connection)

    yield* addWalletToUser(updatedUserMetadata, disconnect)

    yield* fork(fetchSolanaCollectibles, updatedUserMetadata)
    yield* fork(fetchOpenSeaAssets, updatedUserMetadata)
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
