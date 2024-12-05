import { Name, Chain } from '@audius/common/models'
import { newUserMetadata } from '@audius/common/schemas'
import {
  accountSelectors,
  tokenDashboardPageSelectors,
  tokenDashboardPageActions,
  getContext,
  getSDK
} from '@audius/common/store'
import { call, put, select } from 'typed-redux-saga'

const { getAccountUser } = accountSelectors
const { updateWalletError } = tokenDashboardPageActions
const { getConfirmingWallet } = tokenDashboardPageSelectors

export function* associateNewWallet(signature: string) {
  const { wallet, chain } = yield* select(getConfirmingWallet)
  if (!wallet || !chain) return null

  const analytics = yield* getContext('analytics')
  const audiusBackend = yield* getContext('audiusBackendInstance')
  const sdk = yield* getSDK()
  const userMetadata = yield* select(getAccountUser)

  const updatedMetadata = newUserMetadata({ ...userMetadata })

  if (!updatedMetadata.metadata_multihash) {
    yield* put(
      updateWalletError({
        errorMessage:
          'An error occured while connecting a wallet with your account'
      })
    )
    analytics.track({
      eventName: Name.CONNECT_WALLET_ASSOCIATION_ERROR,
      properties: {
        chain,
        walletAddress: wallet,
        details: 'Missing metadata_multihash'
      }
    })
    return null
  }

  const associatedWalletsKey =
    chain === Chain.Eth ? 'associated_wallets' : 'associated_sol_wallets'

  const currentWalletSignatures = (yield* call(
    audiusBackend.fetchUserAssociatedWallets,
    { user: updatedMetadata, sdk }
  ))?.[associatedWalletsKey]

  const associatedWallets = {
    ...currentWalletSignatures,
    [wallet]: { signature }
  }

  updatedMetadata[associatedWalletsKey] = associatedWallets

  return updatedMetadata
}
