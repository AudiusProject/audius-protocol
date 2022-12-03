import { tokenDashboardPageActions } from '@audius/common'
import { put, takeEvery } from 'typed-redux-saga'

import { addWalletToUser } from './addWalletToUser'
import { associateNewWallet } from './associateNewWallet'
import { checkIsNewWallet } from './checkIsNewWallet'
import { disconnectWallet } from './disconnectWallet'
import { establishWalletConnection } from './establishWalletConnection'
import { getWalletAddress } from './getWalletAddress'
import { getWalletInfo } from './getWalletInfo'
import { signMessage } from './signMessage'
const { connectNewWallet } = tokenDashboardPageActions

const { setIsConnectingWallet } = tokenDashboardPageActions

function* handleConnectNewWallet() {
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
}

export function* watchConnectNewWallet() {
  yield* takeEvery(connectNewWallet.type, handleConnectNewWallet)
}
