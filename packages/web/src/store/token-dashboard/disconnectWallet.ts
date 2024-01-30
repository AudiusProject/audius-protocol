import { Chain } from '@audius/common/models'
import {} from '@audius/common'
import { call } from 'typed-redux-saga'

import {
  EthWalletConnection,
  PhantomWalletConnection,
  WalletConnection
} from './types'

async function initWalletLink() {
  return await import('walletlink')
}

function* disconnectEthWallet(connection: EthWalletConnection) {
  const { provider } = connection
  try {
    const { WalletLinkProvider } = yield* call(initWalletLink)
    if (provider?.currentProvider?.disconnect) {
      provider.currentProvider.disconnect()
    }
    if (provider?.currentProvider?.close) {
      if (provider?.currentProvider instanceof WalletLinkProvider) {
        // If we are using wallet link, re-define relay connection close
        // which triggers a document reload. If the redefinition fails
        // See source:
        // https://github.com/walletlink/walletlink/blob/522e9239c47aa2417c967fac2c4422024055c4d2/js/src/relay/WalletLinkRelay.ts#L131
        try {
          provider.currentProvider._relay.resetAndReload = () => {
            const relay = provider.currentProvider._relay
            relay.connection
              .setSessionMetadata('__destroyed', '1')
              .subscribe(() => {
                relay.connection.destroy()
                relay.storage.clear()
                // Intentionally leave out document.location.reload()
              })
          }
        } catch (e) {
          console.error(e)
          // Do nothing
        }
      }
      yield* call(provider.currentProvider.close)
    }
  } catch (e) {
    console.error('Failed to disconnect web3 instance')
    console.error(e)
    // Do nothing
  }
}

function* disconnectPhantomWallet(connection: PhantomWalletConnection) {
  yield* call([connection.provider, 'disconnect'])
}

export function* disconnectWallet(connection: WalletConnection) {
  switch (connection.chain) {
    case Chain.Eth: {
      yield* call(disconnectEthWallet, connection)
      break
    }
    case Chain.Sol: {
      yield* call(disconnectPhantomWallet, connection)
      break
    }
  }
}
