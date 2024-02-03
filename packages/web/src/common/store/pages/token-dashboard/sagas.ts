import { Chain, CollectibleState } from '@audius/common/models'
import {
  accountSelectors,
  tokenDashboardPageActions,
  getContext
} from '@audius/common/store'
import { call, put, select, takeLatest } from 'typed-redux-saga'

import {
  fetchOpenSeaNftMetadatasForWallets,
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
    fetchOpenSeaNftMetadatasForWallets,
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

function* fetchSplCollectibles(wallets: string[]) {
  const collectiblesMap = (yield* call(
    fetchSolanaCollectiblesForWallets,
    wallets
  )) as CollectibleState

  const collectibleCounts = wallets.map(
    (wallet) => collectiblesMap[wallet]?.length ?? 0
  )

  return wallets.map((_, idx) => ({
    collectibleCount: collectibleCounts[idx]
  }))
}

function* fetchSplWalletInfo(wallets: string[]) {
  const walletClient = yield* getContext('walletClient')
  const splWalletBalances = yield* call(
    [walletClient, 'getSolWalletBalances'],
    wallets
  )

  return wallets.map((_, idx) => ({
    ...splWalletBalances[idx]
  }))
}

function* fetchAccountAssociatedWallets() {
  // TODO C-3163 - Add loading state for fetching associated wallets
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

  // Put balances first w/o collectibles

  yield* put(
    setAssociatedWallets({
      associatedWallets: ethWalletBalances,
      chain: Chain.Eth
    })
  )
  yield* put(
    setAssociatedWallets({
      associatedWallets: splWalletBalances.map((b) => ({
        ...b,
        collectibleCount: 0
      })),
      chain: Chain.Sol
    })
  )

  // Add collectibles, this can take a while if fetching metadata is slow

  const splWalletCollectibles = yield* fetchSplCollectibles(
    associatedWallets.sol_wallets ?? []
  )

  yield* put(
    setAssociatedWallets({
      associatedWallets: splWalletBalances.map((b, i) => ({
        ...b,
        collectibleCount: splWalletCollectibles[i].collectibleCount
      })),
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
