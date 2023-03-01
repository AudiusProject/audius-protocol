import { tokenDashboardPageActions } from '@audius/common'
import * as Sentry from '@sentry/browser'
import { put, takeEvery } from 'typed-redux-saga'

import { addWalletToUser } from 'common/store/pages/token-dashboard/addWalletToUser'
import { associateNewWallet } from 'common/store/pages/token-dashboard/associateNewWallet'
import { checkIsNewWallet } from 'common/store/pages/token-dashboard/checkIsNewWallet'
import { getWalletInfo } from 'common/store/pages/token-dashboard/getWalletInfo'

import { disconnectWallet } from './disconnectWallet'
import { establishWalletConnection } from './establishWalletConnection'
import { getWalletAddress } from './getWalletAddress'
import { signMessage } from './signMessage'

const { connectNewWallet } = tokenDashboardPageActions

const { setIsConnectingWallet, setModalState, resetStatus } =
  tokenDashboardPageActions

function* handleConnectNewWallet() {
  try {
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

    const signature = yield* signMessage(connection)
    const updatedUserMetadata = yield* associateNewWallet(signature)

    const disconnect = () => disconnectWallet(connection)

    yield* addWalletToUser(updatedUserMetadata, disconnect)
  } catch (e) {
    // Very likely we hit error path here i.e. user closes the web3 popup. Log it and restart
    const err = `Caught error during handleConnectNewWallet:  ${e}, resetting to initial state`
    console.warn(err)
    Sentry.captureException(err)
    yield* put(
      setModalState({
        modalState: {
          stage: 'CONNECT_WALLETS',
          flowState: { stage: 'ADD_WALLET' }
        }
      })
    )
    yield* put(resetStatus())
  }
}

export function* watchConnectNewWallet() {
  yield* takeEvery(connectNewWallet.type, handleConnectNewWallet)
}
