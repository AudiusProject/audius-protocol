import { ConnectedWallets } from '@audius/sdk'

import { UserWallets } from '~/models'

export const userWalletsFromSDK = (input: ConnectedWallets): UserWallets => {
  return {
    wallets: input.ercWallets,
    sol_wallets: input.splWallets
  }
}
