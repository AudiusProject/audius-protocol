import {
  Chain,
  accountSelectors,
  tokenDashboardPageActions,
  getContext,
  CollectibleState
} from '@audius/common'
import { call, put, select, takeLatest } from 'typed-redux-saga'

import {
  fetchOpenSeaAssetsForWallets,
  fetchSolanaCollectiblesForWallets
} from 'common/store/profile/sagas'
import { waitForRead } from 'utils/sagaHelpers'

import { watchRemoveWallet } from './removeWalletSaga'

const { fetchAssociatedWallets, setAssociatedWallets } =
  tokenDashboardPageActions

const { getUserId } = accountSelectors

function* fetchEthWalletInfo(wallets: string[]) {
  const walletClient = yield* getContext('walletClient')
  const ethWalletBalances = yield* call(
    [walletClient, 'getEthWalletBalances'],
    wallets
  )

  const collectiblesMap = (yield* call(
    fetchOpenSeaAssetsForWallets,
    wallets
  )) as CollectibleState

  const collectibleCounts = wallets.map(
    (wallet) => collectiblesMap[wallet]?.length ?? 0
  )

  return wallets.map((_, idx) => ({
    ...ethWalletBalances[idx],
    collectibleCount: collectibleCounts[idx]
  }))
}

function* fetchSplWalletInfo(wallets: string[]) {
  const walletClient = yield* getContext('walletClient')
  const splWalletBalances = yield* call(
    [walletClient, 'getSolWalletBalances'],
    wallets
  )

  const collectiblesMap = (yield* call(
    fetchSolanaCollectiblesForWallets,
    wallets
  )) as CollectibleState

  const collectibleCounts = wallets.map(
    (wallet) => collectiblesMap[wallet]?.length ?? 0
  )

  return wallets.map((_, idx) => ({
    ...splWalletBalances[idx],
    collectibleCount: collectibleCounts[idx]
  }))
}

function* fetchAccountAssociatedWallets() {
  yield* waitForRead()
  const apiClient = yield* getContext('apiClient')
  const accountUserId = yield* select(getUserId)
  if (!accountUserId) return
  const associatedWallets = yield* call(
    [apiClient, apiClient.getAssociatedWallets],
    {
      userID: accountUserId
    }
  )
  if (!associatedWallets) {
    return
  }
  const ethWalletBalances = yield* fetchEthWalletInfo(associatedWallets.wallets)

  const splWalletBalances = yield* fetchSplWalletInfo(
    associatedWallets.sol_wallets ?? []
  )

  yield* put(
    setAssociatedWallets({
      associatedWallets: ethWalletBalances,
      chain: Chain.Eth
    })
  )
  yield* put(
    setAssociatedWallets({
      associatedWallets: splWalletBalances,
      chain: Chain.Sol
    })
  )
}

function* watchGetAssociatedWallets() {
  yield* takeLatest(fetchAssociatedWallets.type, fetchAccountAssociatedWallets)
}

const sagas = () => {
  return [watchGetAssociatedWallets, watchRemoveWallet]
}

export default sagas
