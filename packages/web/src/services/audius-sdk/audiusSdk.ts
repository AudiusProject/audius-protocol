import { AudiusSdk, sdk, Configuration, SolanaRelay } from '@audius/sdk'
import { createWalletClient, custom } from 'viem'
import { mainnet } from 'viem/chains'
import { getHttpRpcClient } from 'viem/utils'

import { discoveryNodeSelectorService } from 'services/audius-sdk/discoveryNodeSelector'
import { env } from 'services/env'

import { getAudiusWalletClient } from './auth'

declare global {
  interface Window {
    audiusSdk: AudiusSdk
  }
}

let inProgress = false
const SDK_LOADED_EVENT_NAME = 'AUDIUS_SDK_LOADED'

export const initSdk = async (opts?: { useExternalWallet?: boolean }) => {
  inProgress = true

  // For now, the only solana relay we want to use is on DN 1, so hardcode
  // the selection there.
  const solanaRelay = new SolanaRelay(
    new Configuration({
      basePath: '/solana',
      headers: {
        'Content-Type': 'application/json'
      },
      middleware: [
        {
          pre: async (context) => {
            const endpoint = env.SOLANA_RELAY_ENDPOINT
            const url = `${endpoint}${context.url}`
            return { url, init: context.init }
          }
        }
      ]
    })
  )

  // Overrides some DN configuration from optimizely
  const discoveryNodeSelector = await discoveryNodeSelectorService.getInstance()

  // Set up a relay to identity for Ethereum RPC requests so that identity can
  // pay for gas fees on approved transactions.
  const audiusWalletClient = await getAudiusWalletClient({
    ensureUserExists: !opts?.useExternalWallet
  })
  const ethWalletClient = createWalletClient({
    account: '0x0000000000000000000000000000000000000000', // dummy replaced by relay DO NOT REMOVE
    chain: mainnet,
    transport: custom({
      request: async (request) => {
        const message = `signature:${new Date().getTime()}`
        const signature = await audiusWalletClient.signMessage({ message })
        const rpcClient = getHttpRpcClient(
          `${env.IDENTITY_SERVICE}/ethereum/rpc`,
          {
            fetchOptions: {
              headers: {
                'Encoded-Data-Message': message,
                'Encoded-Data-Signature': signature
              }
            }
          }
        )
        return await rpcClient.request(request)
      }
    })
  })
  const audiusSdk = sdk({
    appName: env.APP_NAME,
    apiKey: env.API_KEY,
    environment: env.ENVIRONMENT,
    services: {
      discoveryNodeSelector,
      solanaRelay,
      audiusWalletClient,
      ethWalletClient
    }
  })
  console.debug('[audiusSdk] SDK initted.')
  window.audiusSdk = audiusSdk
  inProgress = false
  window.dispatchEvent(new CustomEvent(SDK_LOADED_EVENT_NAME))
  return audiusSdk
}

export const audiusSdk = async () => {
  if (inProgress) {
    await new Promise((resolve) => {
      window.addEventListener(SDK_LOADED_EVENT_NAME, resolve)
    })
  } else if (!window.audiusSdk) {
    return await initSdk()
  }
  return window.audiusSdk
}
