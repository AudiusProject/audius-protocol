import {
  accountSelectors,
  Chain,
  getContext,
  newUserMetadata,
  tokenDashboardPageActions,
  tokenDashboardPageSelectors
} from '@audius/common'
import { call, put, select } from 'typed-redux-saga'

import { upgradeToCreator } from 'common/store/cache/users/sagas'
import { fetchServices } from 'common/store/service-selection/slice'
const { getAccountUser } = accountSelectors
const { updateWalletError } = tokenDashboardPageActions
const { getConfirmingWallet } = tokenDashboardPageSelectors

export function* associateNewWallet(signature: string) {
  const { wallet, chain } = yield* select(getConfirmingWallet)
  if (!wallet || !chain) return

  const audiusBackend = yield* getContext('audiusBackendInstance')
  const userMetadata = yield* select(getAccountUser)
  let updatedMetadata = newUserMetadata({ ...userMetadata })

  if (
    !updatedMetadata.creator_node_endpoint ||
    !updatedMetadata.metadata_multihash
  ) {
    yield* put(fetchServices())
    const upgradedToCreator = yield* call(upgradeToCreator)
    if (!upgradedToCreator) {
      yield* put(
        updateWalletError({
          errorMessage:
            'An error occured while connecting a wallet with your account.'
        })
      )
      return
    }
    const updatedUserMetadata = yield* select(getAccountUser)
    updatedMetadata = newUserMetadata({ ...updatedUserMetadata })
  }

  const currentWalletSignatures = yield* call(
    chain === Chain.Eth
      ? audiusBackend.fetchUserAssociatedEthWallets
      : audiusBackend.fetchUserAssociatedSolWallets,
    updatedMetadata
  )

  const associatedWallets = {
    ...currentWalletSignatures,
    [wallet]: { signature }
  }

  const associatedWalletsKey =
    chain === Chain.Eth ? 'associated_wallets' : 'associated_sol_wallets'

  updatedMetadata[associatedWalletsKey] = associatedWallets

  return updatedMetadata
}
