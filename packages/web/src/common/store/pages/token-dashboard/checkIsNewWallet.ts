import {
  tokenDashboardPageSelectors,
  tokenDashboardPageActions,
  getContext
} from '@audius/common/store'
import {} from '@audius/common'
import { Name, Chain } from '@audius/common/models'
import { call, put, select } from 'typed-redux-saga'

const { getAssociatedWallets } = tokenDashboardPageSelectors
const { updateWalletError } = tokenDashboardPageActions

export function* checkIsNewWallet(walletAddress: string, chain: Chain) {
  const apiClient = yield* getContext('apiClient')
  const { connectedEthWallets, connectedSolWallets } = yield* select(
    getAssociatedWallets
  )

  const associatedUserId = yield* call(
    [apiClient, apiClient.getAssociatedWalletUserId],
    {
      address: walletAddress
    }
  )

  const associatedWallets =
    chain === Chain.Eth ? connectedEthWallets : connectedSolWallets

  if (
    associatedUserId ||
    associatedWallets?.some(({ address }) => address === walletAddress)
  ) {
    // The wallet already exists in the associated wallets set
    yield* put(
      updateWalletError({
        errorMessage:
          'This wallet has already been associated with an Audius account.'
      })
    )

    const analytics = yield* getContext('analytics')
    analytics.track({
      eventName: Name.CONNECT_WALLET_ALREADY_ASSOCIATED,
      properties: {
        chain,
        walletAddress
      }
    })

    return false
  }
  return true
}
