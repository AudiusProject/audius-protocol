import {
  sdk as AudiusSdk,
  DiscoveryNodeSelector,
  SolanaRelay,
  Configuration,
  UserAuth
} from '@audius/sdk'

import { WalletManager, getPlatformCreateKey } from '@audius/hedgehog'

import {
  Utils as AudiusUtils,
  libs as AudiusLibs
} from '@audius/sdk-legacy/dist/libs.js'
import { PublicKey } from '@solana/web3.js'

import { LocalStorage } from 'node-localstorage'
const localStorage = new LocalStorage('./local-storage')

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

/**
 * @type {import('@audius/sdk').AudiusSdk}
 */
let audiusSdk
let currentUserId
let currentHandle
export const initializeAudiusSdk = async ({ handle } = {}) => {
  let isDummyWallet = false
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

  if (!audiusSdk || !currentUserId || (handle && currentHandle !== handle)) {
    // If handle was provided, unset current entropy and replace with the entropy
    // for the given user before initializing UserAuth
    if (handle) {
      localStorage.removeItem('hedgehog-entropy-key')
      const handleEntropy = localStorage.getItem(`handle-${handle}`)
      if (!handleEntropy) {
        throw new Error(`Failed to find entropy for handle ${handle}`)
      }
      localStorage.setItem('hedgehog-entropy-key', handleEntropy)
    } else {
      isDummyWallet = true
      // If we aren't logged in, create dummy entropy so sdk/libs work correctly
      const entropy = localStorage.getItem('hedgehog-entropy-key')
      if (!entropy) {
        const password = `audius-dummy-pkey-${Math.floor(
          Math.random() * 1000000
        )}`
        const result = await WalletManager.createWalletObj(
          password,
          null,
          localStorage,
          getPlatformCreateKey()
        )
        console.log(result.walletObj.getPrivateKeyString())
        const entropy = localStorage.getItem('hedgehog-entropy-key')
        if (!entropy) {
          throw new Error('Failed to create entropy')
        }
      }
    }

    const auth = new UserAuth({
      useLocalStorage: true,
      localStorage: new Promise((resolve) => resolve(localStorage)),
      identityService: process.env.IDENTITY_SERVICE_URL
    })

    audiusSdk = AudiusSdk({
      appName: 'audius-cmd',
      environment: 'development',
      services: {
        auth,
        solanaRelay
      }
    })

    currentHandle = handle

    if (!isDummyWallet) {
      try {
        const wallet = await audiusSdk.services.auth.getAddress()
        // Try to get current user. May fail if we're using a dummy entropy
        const {
          data: { user }
        } = await audiusSdk.full.users.getUserAccount({
          wallet
        })
        if (user) {
          currentUserId = await parseUserId(user.id)
          if (!currentUserId) {
            console.warn('Failed to parse currentUserId')
          }
        }
      } catch (e) {
        console.warn('Failed to get currentUser', e)
      }
    }
  }

  return audiusSdk
}

export const initializeAudiusLibs = async (handle) => {
  const audiusSdk = await initializeAudiusSdk({ handle })
  const { wallet } = await audiusSdk.services.auth.getAddress()
  const userId = currentUserId

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
      }),
      userId,
      wallet
    },
    creatorNodeConfig: {
      ...AudiusLibs.configCreatorNode(
        'http://audius-protocol-creator-node-1'
        // process.env.FALLBACK_CREATOR_NODE_URL,
      ),
      wallet,
      userId
    },
    identityServiceConfig: AudiusLibs.configIdentityService(
      process.env.IDENTITY_SERVICE_URL
    ),
    isServer: true,
    enableUserReplicaSetManagerContract: true,
    isStorageV2Only: true,
    useDiscoveryRelay: true,
    wallet,
    userId
  })

  await audiusLibs.init()
  audiusLibs.web3Manager.setDiscoveryProvider(audiusLibs.discoveryProvider)
  return audiusLibs
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

export const getCurrentAudiusSdkUser = async () => {
  if (!audiusSdk) {
    throw new Error('sdk not initialized')
  }
  const wallet = await audiusSdk.services.auth.getAddress()
  const {
    data: { user }
  } = await audiusSdk.full.users.getUserAccount({ wallet })
  return user
}
