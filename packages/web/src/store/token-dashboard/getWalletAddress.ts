import { Chain } from '@audius/common/models'
import { call } from 'typed-redux-saga'

import { WalletConnection } from './types'

export function* getWalletAddress(connection: WalletConnection) {
  switch (connection.chain) {
    case Chain.Eth: {
      const accounts: string[] = yield* call(
        connection.provider.eth.getAccounts as () => Promise<string[]>
      )
      return accounts[0]
    }
    case Chain.Sol: {
      return connection.provider.publicKey?.toString()
    }
  }
}
