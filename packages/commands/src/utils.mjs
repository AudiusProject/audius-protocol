import {
  sdk as AudiusSdk,
  DiscoveryNodeSelector,
  SolanaRelay,
  Configuration
} from '@audius/sdk'

import {
  Utils as AudiusUtils,
  libs as AudiusLibs
} from '@audius/sdk-legacy/dist/libs.js'
import { PublicKey } from '@solana/web3.js'

export const initializeAudiusLibs = async (handle) => {
  const audiusLibs = new AudiusLibs({
    ethWeb3Config: AudiusLibs.configEthWeb3(
      process.env.ETH_TOKEN_ADDRESS,
      process.env.ETH_REGISTRY_ADDRESS,
      process.env.ETH_PROVIDER_URL,
      process.env.ETH_OWNER_WALLET
    ),
    web3Config: AudiusLibs.configInternalWeb3(
      process.env.POA_REGISTRY_ADDRESS,
      process.env.POA_PROVIDER_URL,
      null,
      process.env.ENTITY_MANAGER_ADDRESS
    ),
    solanaWeb3Config: AudiusLibs.configSolanaWeb3({
      solanaClusterEndpoint: process.env.SOLANA_ENDPOINT,
      solanaTokenAddress: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
      mintAddress: process.env.SOLANA_TOKEN_MINT_PUBLIC_KEY,
      usdcMintAddress: process.env.SOLANA_USDC_TOKEN_MINT_PUBLIC_KEY,
      claimableTokenProgramAddress:
        process.env.SOLANA_CLAIMABLE_TOKENS_PUBLIC_KEY,
      rewardsManagerProgramId: process.env.SOLANA_REWARD_MANAGER_PUBLIC_KEY,
      rewardsManagerProgramPDA:
        process.env.SOLANA_REWARD_MANAGER_PDA_PUBLIC_KEY,
      rewardsManagerTokenPDA:
        process.env.SOLANA_REWARD_MANAGER_TOKEN_PDA_PUBLIC_KEY,
      feePayerSecretKeys: [
        Uint8Array.from(JSON.parse(process.env.SOLANA_FEEPAYER_SECRET_KEY))
      ],
      useRelay: true
    }),
    discoveryProviderConfig: {
      discoveryNodeSelector: new DiscoveryNodeSelector({
        initialSelectedNode: 'http://audius-protocol-discovery-provider-1'
      })
    },
    creatorNodeConfig: AudiusLibs.configCreatorNode(
      'http://audius-protocol-creator-node-1'
      // process.env.FALLBACK_CREATOR_NODE_URL,
    ),
    identityServiceConfig: AudiusLibs.configIdentityService(
      process.env.IDENTITY_SERVICE_URL
    ),
    isServer: true,
    enableUserReplicaSetManagerContract: true,
    isStorageV2Only: true,
    useDiscoveryRelay: true
  })

  await audiusLibs.init()

  if (handle) {
    // Log out of existing user, log in as new user, and re-init
    await audiusLibs.Account.logout()
    await audiusLibs.localStorage.removeItem('hedgehog-entropy-key')
    await audiusLibs.localStorage.setItem(
      'hedgehog-entropy-key',
      audiusLibs.localStorage.getItem(`handle-${handle}`)
    )
    await audiusLibs.init()
  }

  return audiusLibs
}

/**
 * @type {import('@audius/sdk').AudiusSdk}
 */
let audiusSdk
export const initializeAudiusSdk = async ({
  apiKey = undefined,
  apiSecret = undefined
} = {}) => {
  const solanaRelay = new SolanaRelay(
    new Configuration({
      basePath: '/solana',
      headers: {
        'Content-Type': 'application/json'
      },
      middleware: [
        {
          pre: async (context) => {
            const endpoint = 'http://audius-protocol-discovery-provider-1'
            const url = `${endpoint}${context.url}`
            return { url, init: context.init }
          }
        }
      ]
    })
  )

  if (!audiusSdk) {
    audiusSdk = AudiusSdk({
      appName: 'audius-cmd',
      apiKey,
      apiSecret,
      environment: 'development',
      services: {
        solanaRelay
      }
    })
  }

  return audiusSdk
}

export const parseUserId = async (arg) => {
  if (arg.startsWith('@')) {
    // @handle
    const audiusSdk = await initializeAudiusSdk()
    const {
      data: { id }
    } = await audiusSdk.users.getUserByHandle({ handle: arg.slice(1) })
    return AudiusUtils.decodeHashId(id)
  } else if (arg.startsWith('#')) {
    // #userId
    return Number(arg.slice(1))
  } else {
    // encoded user id
    return AudiusUtils.decodeHashId(arg)
  }
}

export const parseSplWallet = async (arg) => {
  if (arg.startsWith('@') || arg.startsWith('#') || arg.length < 32) {
    // not splWallet
    const audiusSdk = await initializeAudiusSdk()
    const audiusLibs = await initializeAudiusLibs()
    const {
      data: { splWallet, ercWallet }
    } = await audiusSdk.users.getUser({
      id: AudiusUtils.encodeHashId(await parseUserId(arg))
    })
    if (!splWallet) {
      const { userbank } =
        await audiusLibs.solanaWeb3Manager.createUserBankIfNeeded({
          ethAddress: ercWallet
        })
      return userbank
    }
    return new PublicKey(splWallet)
  } else {
    // splWallet
    return new PublicKey(arg)
  }
}
