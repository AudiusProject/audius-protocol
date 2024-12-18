import { AUDIO, wAUDIO } from '@audius/fixed-decimal'
import { AudiusSdk, type StorageNodeSelectorService } from '@audius/sdk'
import { DiscoveryAPI } from '@audius/sdk-legacy/dist/core'
import { type AudiusLibs as AudiusLibsType } from '@audius/sdk-legacy/dist/libs'
import type { HedgehogConfig } from '@audius/sdk-legacy/dist/services/hedgehog'
import type { LocalStorage } from '@audius/sdk-legacy/dist/utils/localStorage'
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAccount,
  TOKEN_PROGRAM_ID,
  TokenAccountNotFoundError,
  TokenInvalidAccountOwnerError
} from '@solana/spl-token'
import {
  Connection,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
  TransactionInstruction,
  VersionedTransaction
} from '@solana/web3.js'
import BN from 'bn.js'

import { userMetadataToSdk } from '~/adapters/user'
import { Env } from '~/services/env'
import dayjs from '~/utils/dayjs'

import {
  BNWei,
  ID,
  InstagramUser,
  Name,
  TikTokUser,
  UserMetadata,
  ComputedUserProperties,
  Id
} from '../../models'
import { AnalyticsEvent } from '../../models/Analytics'
import { ReportToSentryArgs } from '../../models/ErrorReporting'
import * as schemas from '../../schemas'
import {
  FeatureFlags,
  BooleanKeys,
  IntKeys,
  StringKeys,
  RemoteConfigInstance
} from '../../services/remote-config'
import {
  BrowserNotificationSetting,
  PushNotificationSetting,
  PushNotifications
} from '../../store'
import {
  getErrorMessage,
  uuid,
  Maybe,
  Nullable,
  isNullOrUndefined
} from '../../utils'
import type { DiscoveryNodeSelectorService } from '../sdk/discovery-node-selector'

import { MintName } from './solana'
import { MonitoringCallbacks } from './types'

type DisplayEncoding = 'utf8' | 'hex'
type PhantomEvent = 'disconnect' | 'connect' | 'accountChanged'
type PhantomRequestMethod =
  | 'connect'
  | 'disconnect'
  | 'signTransaction'
  | 'signAllTransactions'
  | 'signMessage'

interface ConnectOpts {
  onlyIfTrusted: boolean
}
export interface PhantomProvider {
  publicKey: PublicKey | null
  isConnected: boolean | null
  isPhantom: boolean
  signTransaction: (transaction: Transaction) => Promise<Transaction>
  signAndSendTransaction: (
    transaction: Transaction | VersionedTransaction
  ) => Promise<Transaction>
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>
  signMessage: (
    message: Uint8Array | string,
    display?: DisplayEncoding
  ) => Promise<any>
  connect: (opts?: Partial<ConnectOpts>) => Promise<{ publicKey: PublicKey }>
  disconnect: () => Promise<void>
  on: (event: PhantomEvent, handler: (args: any) => void) => void
  request: (method: PhantomRequestMethod, params: any) => Promise<unknown>
}
declare global {
  interface Window {
    web3Loaded: boolean
    phantom: any
    solana: PhantomProvider
    Web3: any
  }
}

export const AuthHeaders = Object.freeze({
  Message: 'Encoded-Data-Message',
  Signature: 'Encoded-Data-Signature'
})

// TODO: type these once libs types are improved
let AudiusLibs: any = null
export let BackendUtils: any = null

let audiusLibs: any = null
const unauthenticatedUuid = uuid()

export type TransactionReceipt = { blockHash: string; blockNumber: number }

type DiscoveryProviderListener = (endpoint: Nullable<string>) => void

type AudiusBackendSolanaConfig = Partial<{
  claimableTokenPda: string
  claimableTokenProgramAddress: string
  rewardsManagerProgramId: string
  rewardsManagerProgramPda: string
  rewardsManagerTokenPda: string
  paymentRouterProgramId: string
  solanaClusterEndpoint: string
  solanaFeePayerAddress: string
  solanaTokenAddress: string
  waudioMintAddress: string
  usdcMintAddress: string
  wormholeAddress: string
}>

type AudiusBackendWormholeConfig = Partial<{
  ethBridgeAddress: string
  ethTokenBridgeAddress: string
  solBridgeAddress: string
  solTokenBridgeAddress: string
  wormholeRpcHosts: string
}>

type WithEagerOption = (
  options: {
    normal: (libs: any) => any
    eager: (...args: any) => any
    endpoint?: string
    requiresUser?: boolean
  },
  ...args: any
) => Promise<any>

type WaitForLibsInit = () => Promise<unknown>

type AudiusBackendParams = {
  claimDistributionContractAddress: Maybe<string>
  env: Env
  ethOwnerWallet: Maybe<string>
  ethProviderUrls: Maybe<string[]>
  ethRegistryAddress: Maybe<string>
  ethTokenAddress: Maybe<string>
  discoveryNodeSelectorService: DiscoveryNodeSelectorService
  getFeatureEnabled: (
    flag: FeatureFlags,
    fallbackFlag?: FeatureFlags
  ) => Promise<boolean | null> | null | boolean
  getHostUrl: () => Nullable<string>
  getLibs: () => Promise<any>
  getStorageNodeSelector: () => Promise<StorageNodeSelectorService>
  getWeb3Config: (
    libs: any,
    registryAddress: Maybe<string>,
    entityManagerAddress: Maybe<string>,
    web3ProviderUrls: Maybe<string[]>,
    web3NetworkId: Maybe<string>
  ) => Promise<any>
  // Not required on web
  hedgehogConfig?: {
    createKey: HedgehogConfig['createKey']
  }
  identityServiceUrl: Maybe<string>
  generalAdmissionUrl: Maybe<string>
  isElectron: Maybe<boolean>
  localStorage?: LocalStorage
  monitoringCallbacks: MonitoringCallbacks
  nativeMobile: Maybe<boolean>
  onLibsInit: (libs: any) => void
  recaptchaSiteKey: Maybe<string>
  recordAnalytics: (event: AnalyticsEvent, callback?: () => void) => void
  reportError: ({
    level,
    additionalInfo,
    error,
    name
  }: ReportToSentryArgs) => void | Promise<void>
  registryAddress: Maybe<string>
  entityManagerAddress: Maybe<string>
  remoteConfigInstance: RemoteConfigInstance
  setLocalStorageItem: (key: string, value: string) => Promise<void>
  solanaConfig: AudiusBackendSolanaConfig
  userNodeUrl: Maybe<string>
  waitForLibsInit: WaitForLibsInit
  waitForWeb3: () => Promise<void>
  web3NetworkId: Maybe<string>
  web3ProviderUrls: Maybe<string[]>
  withEagerOption: WithEagerOption
  wormholeConfig: AudiusBackendWormholeConfig
}

export const audiusBackend = ({
  claimDistributionContractAddress,
  env,
  ethOwnerWallet,
  ethProviderUrls,
  ethRegistryAddress,
  ethTokenAddress,
  discoveryNodeSelectorService,
  getLibs,
  getStorageNodeSelector,
  getWeb3Config,
  hedgehogConfig,
  identityServiceUrl,
  generalAdmissionUrl,
  isElectron,
  localStorage,
  monitoringCallbacks,
  nativeMobile,
  onLibsInit,
  recaptchaSiteKey,
  recordAnalytics,
  registryAddress,
  entityManagerAddress,
  reportError,
  remoteConfigInstance,
  solanaConfig: {
    claimableTokenPda,
    claimableTokenProgramAddress,
    rewardsManagerProgramId,
    rewardsManagerProgramPda,
    rewardsManagerTokenPda,
    paymentRouterProgramId,
    solanaClusterEndpoint,
    solanaFeePayerAddress,
    solanaTokenAddress,
    waudioMintAddress,
    usdcMintAddress,
    wormholeAddress
  },
  userNodeUrl,
  waitForLibsInit,
  waitForWeb3,
  web3NetworkId,
  web3ProviderUrls,
  withEagerOption,
  wormholeConfig: {
    ethBridgeAddress,
    ethTokenBridgeAddress,
    solBridgeAddress,
    solTokenBridgeAddress,
    wormholeRpcHosts
  }
}: AudiusBackendParams) => {
  const { getRemoteVar, waitForRemoteConfig } = remoteConfigInstance

  const currentDiscoveryProvider: Nullable<string> = null
  const didSelectDiscoveryProviderListeners: DiscoveryProviderListener[] = []

  /**
   * Gets a blockList set from remote config
   */
  const getBlockList = (remoteVarKey: StringKeys) => {
    const list = getRemoteVar(remoteVarKey)
    if (list) {
      try {
        return new Set(list.split(','))
      } catch (e) {
        console.error(e)
        return null
      }
    }
    return null
  }

  function addDiscoveryProviderSelectionListener(
    listener: DiscoveryProviderListener
  ) {
    didSelectDiscoveryProviderListeners.push(listener)
    if (currentDiscoveryProvider !== null) {
      listener(currentDiscoveryProvider)
    }
  }

  // Record the endpoint and reason for selecting the endpoint
  function discoveryProviderSelectionCallback(
    endpoint: string,
    decisionTree: { stage: string }[]
  ) {
    recordAnalytics({
      eventName: Name.DISCOVERY_PROVIDER_SELECTION,
      properties: {
        endpoint,
        reason: decisionTree.map((reason) => reason.stage).join(' -> ')
      }
    })
    didSelectDiscoveryProviderListeners.forEach((listener) =>
      listener(endpoint)
    )
  }

  async function setup({
    wallet,
    userId
  }: {
    /* wallet/userId/handle will be passed to libs services and used as parameters
    in various API calls and utility functions. They are optional here because we
    may not be logged in yet. Values can be updated after initialization by calling
    libs.setCurrentUser() */
    wallet?: string
    userId?: number
  }) {
    // Wait for web3 to load if necessary
    await waitForWeb3()
    // Wait for optimizely to load if necessary
    await waitForRemoteConfig()

    const libsModule = await getLibs()

    AudiusLibs = libsModule.AudiusLibs
    BackendUtils = libsModule.Utils
    // initialize libs
    let libsError: Nullable<string> = null
    const { web3Config } = await getWeb3Config(
      AudiusLibs,
      registryAddress,
      entityManagerAddress,
      web3ProviderUrls,
      web3NetworkId
    )
    const { ethWeb3Config } = getEthWeb3Config()
    const { solanaWeb3Config } = getSolanaWeb3Config()
    const { wormholeConfig } = getWormholeConfig()

    const contentNodeBlockList = getBlockList(
      StringKeys.CONTENT_NODE_BLOCK_LIST
    )
    const discoveryNodeBlockList = getBlockList(
      StringKeys.DISCOVERY_NODE_BLOCK_LIST
    )

    const discoveryNodeSelector =
      await discoveryNodeSelectorService.getInstance()

    const initialSelectedNode: string | undefined =
      // TODO: Need a synchronous method to check if a discovery node is already selected?
      // Alternatively, remove all this AudiusBackend/Libs init stuff in favor of SDK
      // @ts-ignore config is private
      discoveryNodeSelector.config.initialSelectedNode
    if (initialSelectedNode) {
      discoveryProviderSelectionCallback(initialSelectedNode, [])
    }
    discoveryNodeSelector.addEventListener('change', (endpoint) => {
      console.debug('[AudiusBackend] DiscoveryNodeSelector changed', endpoint)
      discoveryProviderSelectionCallback(endpoint, [])
    })

    const baseCreatorNodeConfig = AudiusLibs.configCreatorNode(
      userNodeUrl,
      /* passList */ null,
      contentNodeBlockList,
      monitoringCallbacks.contentNode
    )

    try {
      const newAudiusLibs = new AudiusLibs({
        localStorage,
        web3Config,
        ethWeb3Config,
        solanaWeb3Config,
        wormholeConfig,
        discoveryProviderConfig: {
          blacklist: discoveryNodeBlockList,
          reselectTimeout: getRemoteVar(
            IntKeys.DISCOVERY_PROVIDER_SELECTION_TIMEOUT_MS
          ),
          selectionCallback: discoveryProviderSelectionCallback,
          monitoringCallbacks: monitoringCallbacks.discoveryNode,
          selectionRequestTimeout: getRemoteVar(
            IntKeys.DISCOVERY_NODE_SELECTION_REQUEST_TIMEOUT
          ),
          selectionRequestRetries: getRemoteVar(
            IntKeys.DISCOVERY_NODE_SELECTION_REQUEST_RETRIES
          ),
          unhealthySlotDiffPlays: getRemoteVar(
            BooleanKeys.ENABLE_DISCOVERY_NODE_MAX_SLOT_DIFF_PLAYS
          )
            ? getRemoteVar(IntKeys.DISCOVERY_NODE_MAX_SLOT_DIFF_PLAYS)
            : null,
          unhealthyBlockDiff:
            getRemoteVar(IntKeys.DISCOVERY_NODE_MAX_BLOCK_DIFF) ?? undefined,

          discoveryNodeSelector,
          wallet,
          userId
        },
        identityServiceConfig:
          AudiusLibs.configIdentityService(identityServiceUrl),
        creatorNodeConfig: {
          ...baseCreatorNodeConfig,
          wallet,
          userId,
          storageNodeSelector: await getStorageNodeSelector()
        },
        // Electron cannot use captcha until it serves its assets from
        // a "domain" (e.g. localhost) rather than the file system itself.
        // i.e. there is no way to instruct captcha that the domain is "file://"
        captchaConfig: isElectron ? undefined : { siteKey: recaptchaSiteKey },
        isServer: false,
        preferHigherPatchForPrimary: true,
        preferHigherPatchForSecondaries: false,
        hedgehogConfig,
        userId,
        wallet
      })
      await newAudiusLibs.init()
      audiusLibs = newAudiusLibs
      onLibsInit(audiusLibs)
      audiusLibs.web3Manager.discoveryProvider = audiusLibs.discoveryProvider
    } catch (err) {
      console.error(err)
      libsError = getErrorMessage(err)
    }

    return { libsError, web3Error: false }
  }

  function getEthWeb3Config() {
    // In a dev env, always ignore the remote var which is inherited from staging
    const isDevelopment = env.ENVIRONMENT === 'development'
    const providerUrls = isDevelopment
      ? ethProviderUrls
      : getRemoteVar(StringKeys.ETH_PROVIDER_URLS) || ethProviderUrls

    return {
      ethWeb3Config: AudiusLibs.configEthWeb3(
        ethTokenAddress,
        ethRegistryAddress,
        providerUrls,
        ethOwnerWallet,
        claimDistributionContractAddress,
        wormholeAddress
      )
    }
  }

  function getSolanaWeb3Config() {
    if (
      !solanaClusterEndpoint ||
      !waudioMintAddress ||
      !solanaTokenAddress ||
      !solanaFeePayerAddress ||
      !claimableTokenProgramAddress ||
      !rewardsManagerProgramId ||
      !rewardsManagerProgramPda ||
      !rewardsManagerTokenPda ||
      !paymentRouterProgramId
    ) {
      return {
        error: true
      }
    }
    return {
      error: false,
      solanaWeb3Config: AudiusLibs.configSolanaWeb3({
        solanaClusterEndpoint,
        mintAddress: waudioMintAddress,
        usdcMintAddress,
        solanaTokenAddress,
        claimableTokenPDA: claimableTokenPda,
        feePayerAddress: solanaFeePayerAddress,
        claimableTokenProgramAddress,
        rewardsManagerProgramId,
        rewardsManagerProgramPDA: rewardsManagerProgramPda,
        rewardsManagerTokenPDA: rewardsManagerTokenPda,
        paymentRouterProgramId,
        useRelay: true
      })
    }
  }

  function getWormholeConfig() {
    if (
      !wormholeRpcHosts ||
      !ethBridgeAddress ||
      !solBridgeAddress ||
      !ethTokenBridgeAddress ||
      !solTokenBridgeAddress
    ) {
      return {
        error: true
      }
    }

    return {
      error: false,
      wormholeConfig: AudiusLibs.configWormhole({
        rpcHosts: wormholeRpcHosts,
        solBridgeAddress,
        solTokenBridgeAddress,
        ethBridgeAddress,
        ethTokenBridgeAddress
      })
    }
  }

  // TODO(C-2719)
  async function getUserListenCountsMonthly(
    currentUserId: number,
    startTime: string,
    endTime: string
  ) {
    try {
      const userListenCountsMonthly = await withEagerOption(
        {
          normal: (libs) => libs.User.getUserListenCountsMonthly,
          eager: DiscoveryAPI.getUserListenCountsMonthly
        },
        Id.parse(currentUserId),
        startTime,
        endTime
      )
      return userListenCountsMonthly
    } catch (e) {
      console.error(getErrorMessage(e))
      return []
    }
  }

  async function recordTrackListen({
    userId,
    trackId,
    sdk
  }: {
    userId: ID
    trackId: ID
    sdk: AudiusSdk
  }) {
    try {
      const { data, signature } = await signIdentityServiceRequest({ sdk })
      await fetch(`${identityServiceUrl}/tracks/${trackId}/listen`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [AuthHeaders.Message]: data,
          [AuthHeaders.Signature]: signature
        },
        body: JSON.stringify({
          userId: userId ?? unauthenticatedUuid,
          solanaListen: true
        })
      })
    } catch (err) {
      console.error(getErrorMessage(err))
    }
  }

  async function uploadImage(file: File) {
    return await audiusLibs.creatorNode.uploadTrackCoverArtV2(file, () => {})
  }

  /**
   * Retrieves both the user's ETH and SOL associated wallets from the user's metadata CID
   * @param user The user metadata which contains the CID for the metadata multihash
   * @returns Object The associated wallets mapping of address to nested signature
   */
  async function fetchUserAssociatedWallets({
    user,
    sdk
  }: {
    user: UserMetadata
    sdk: AudiusSdk
  }) {
    if (!user?.metadata_multihash) return null

    const { data } = await sdk.full.cidData.getMetadata({
      metadataId: user?.metadata_multihash
    })

    if (!data?.data) return null

    return {
      associated_sol_wallets: data.data.associatedSolWallets ?? null,
      associated_wallets: data.data.associatedWallets ?? null
    }
  }

  async function updateCreator({
    metadata,
    sdk
  }: {
    metadata: UserMetadata &
      Pick<
        ComputedUserProperties,
        'updatedProfilePicture' | 'updatedCoverPhoto'
      >
    sdk: AudiusSdk
  }) {
    let newMetadata = { ...metadata }
    const associatedWallets = await fetchUserAssociatedWallets({
      user: metadata,
      sdk
    })
    // @ts-ignore when writing data, this type is expected to contain a signature
    newMetadata.associated_wallets =
      newMetadata.associated_wallets ?? associatedWallets?.associated_wallets
    // @ts-ignore when writing data, this type is expected to contain a signature
    newMetadata.associated_sol_wallets =
      newMetadata.associated_sol_wallets ??
      associatedWallets?.associated_sol_wallets
    try {
      newMetadata = schemas.newUserMetadata(newMetadata, true)
      const userId = newMetadata.user_id
      const { blockHash, blockNumber } = await sdk.users.updateProfile({
        userId: Id.parse(userId),
        profilePictureFile: newMetadata.updatedProfilePicture?.file,
        coverArtFile: newMetadata.updatedCoverPhoto?.file,
        metadata: userMetadataToSdk(newMetadata)
      })
      return { blockHash, blockNumber, userId }
    } catch (err) {
      console.error(getErrorMessage(err))
      throw err
    }
  }

  async function instagramHandle(handle: string) {
    try {
      const res = await fetch(
        `${generalAdmissionUrl}/social/instagram/${handle}`
      )
      const json: InstagramUser = await res.json()
      return json
    } catch (error) {
      console.error(error)
      return null
    }
  }

  async function tiktokHandle(handle: string) {
    try {
      const res = await fetch(`${generalAdmissionUrl}/social/tiktok/${handle}`)
      const json: TikTokUser = await res.json()
      return json
    } catch (error) {
      console.error(error)
      return null
    }
  }

  async function clearNotificationBadges({ sdk }: { sdk: AudiusSdk }) {
    try {
      const { data, signature } = await signIdentityServiceRequest({ sdk })
      return await fetch(`${identityServiceUrl}/notifications/clear_badges`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [AuthHeaders.Message]: data,
          [AuthHeaders.Signature]: signature
        }
      }).then((res) => res.json())
    } catch (e) {
      console.error(e)
    }
  }

  async function getEmailNotificationSettings({ sdk }: { sdk: AudiusSdk }) {
    try {
      const { data, signature } = await signIdentityServiceRequest({ sdk })
      const res = await fetch(`${identityServiceUrl}/notifications/settings`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          [AuthHeaders.Message]: data,
          [AuthHeaders.Signature]: signature
        }
      }).then((res) => res.json())
      return res
    } catch (e) {
      console.error(e)
    }
  }

  async function updateEmailNotificationSettings({
    sdk,
    emailFrequency,
    userId
  }: {
    sdk: AudiusSdk
    emailFrequency: string
    userId: ID
  }) {
    try {
      const { data, signature } = await signIdentityServiceRequest({ sdk })
      const res = await fetch(
        `${identityServiceUrl}/notifications/settings?user_id=${userId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            [AuthHeaders.Message]: data,
            [AuthHeaders.Signature]: signature
          },
          body: JSON.stringify({ settings: { emailFrequency } })
        }
      ).then((res) => res.json())
      return res
    } catch (e) {
      console.error(e)
    }
  }

  async function updateNotificationSettings({
    sdk,
    settings
  }: {
    sdk: AudiusSdk
    settings: Partial<Record<BrowserNotificationSetting, boolean>>
  }) {
    try {
      const { data, signature } = await signIdentityServiceRequest({ sdk })
      return await fetch(
        `${identityServiceUrl}/push_notifications/browser/settings`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            [AuthHeaders.Message]: data,
            [AuthHeaders.Signature]: signature
          },
          body: JSON.stringify({ settings })
        }
      ).then((res) => res.json())
    } catch (e) {
      console.error(e)
    }
  }

  async function updatePushNotificationSettings({
    sdk,
    settings
  }: {
    sdk: AudiusSdk
    settings: Partial<Record<PushNotificationSetting, boolean>>
  }) {
    try {
      const { data, signature } = await signIdentityServiceRequest({ sdk })
      return await fetch(`${identityServiceUrl}/push_notifications/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [AuthHeaders.Message]: data,
          [AuthHeaders.Signature]: signature
        },
        body: JSON.stringify({ settings })
      }).then((res) => res.json())
    } catch (e) {
      console.error(e)
    }
  }

  async function signData({ sdk, data }: { sdk: AudiusSdk; data: string }) {
    const prefixedMessage = `\x19Ethereum Signed Message:\n${data.length}${data}`
    const [sig, recid] = await sdk.services.audiusWalletClient.sign({
      message: { raw: Buffer.from(prefixedMessage, 'utf-8') }
    })
    const r = Buffer.from(sig.slice(0, 32)).toString('hex')
    const s = Buffer.from(sig.slice(32, 64)).toString('hex')
    const v = (recid + 27).toString(16)
    const signature = `0x${r}${s}${v}`
    return { data, signature }
  }

  async function signGatedContentRequest({ sdk }: { sdk: AudiusSdk }) {
    const data = `Gated content user signature at ${Date.now()}`
    return await signData({ sdk, data })
  }

  async function signIdentityServiceRequest({ sdk }: { sdk: AudiusSdk }) {
    const unixTs = Math.round(new Date().getTime() / 1000) // current unix timestamp (sec)
    const data = `Click sign to authenticate with identity service: ${unixTs}`
    return await signData({ sdk, data })
  }

  async function signDiscoveryNodeRequest({
    sdk,
    input
  }: {
    sdk: AudiusSdk
    input?: any
  }) {
    let data
    if (input) {
      data = input
    } else {
      const unixTs = Math.round(new Date().getTime() / 1000) // current unix timestamp (sec)
      data = `Click sign to authenticate with discovery node: ${unixTs}`
    }
    return await signData({ sdk, data })
  }

  async function getBrowserPushNotificationSettings({
    sdk
  }: {
    sdk: AudiusSdk
  }) {
    try {
      const { data, signature } = await signIdentityServiceRequest({ sdk })
      return await fetch(
        `${identityServiceUrl}/push_notifications/browser/settings`,
        {
          headers: {
            [AuthHeaders.Message]: data,
            [AuthHeaders.Signature]: signature
          }
        }
      )
        .then((res) => res.json())
        .then((res) => res.settings)
    } catch (e) {
      console.error(e)
      return null
    }
  }

  async function getBrowserPushSubscription({
    sdk,
    pushEndpoint
  }: {
    sdk: AudiusSdk
    pushEndpoint: string
  }) {
    await waitForLibsInit()

    try {
      const { data, signature } = await signIdentityServiceRequest({ sdk })
      const endpiont = encodeURIComponent(pushEndpoint)
      return await fetch(
        `${identityServiceUrl}/push_notifications/browser/enabled?endpoint=${endpiont}`,
        {
          headers: {
            [AuthHeaders.Message]: data,
            [AuthHeaders.Signature]: signature
          }
        }
      )
        .then((res) => res.json())
        .then((res) => res.enabled)
    } catch (e) {
      console.error(e)
      return null
    }
  }

  async function getSafariBrowserPushEnabled({
    sdk,
    deviceToken
  }: {
    sdk: AudiusSdk
    deviceToken: string
  }) {
    await waitForLibsInit()

    try {
      const { data, signature } = await signIdentityServiceRequest({ sdk })
      return await fetch(
        `${identityServiceUrl}/push_notifications/device_token/enabled?deviceToken=${deviceToken}&deviceType=safari`,
        {
          headers: {
            [AuthHeaders.Message]: data,
            [AuthHeaders.Signature]: signature
          }
        }
      )
        .then((res) => res.json())
        .then((res) => res.enabled)
    } catch (e) {
      console.error(e)
      return null
    }
  }

  async function updateBrowserNotifications({
    sdk,
    enabled = true,
    subscription
  }: {
    sdk: AudiusSdk
    enabled: boolean
    subscription: PushSubscription
  }) {
    await waitForLibsInit()
    const { data, signature } = await signIdentityServiceRequest({ sdk })
    return await fetch(
      `${identityServiceUrl}/push_notifications/browser/register`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [AuthHeaders.Message]: data,
          [AuthHeaders.Signature]: signature
        },
        body: JSON.stringify({ enabled, subscription })
      }
    ).then((res) => res.json())
  }

  async function disableBrowserNotifications({
    sdk,
    subscription
  }: {
    sdk: AudiusSdk
    subscription: PushSubscription
  }) {
    await waitForLibsInit()
    const { data, signature } = await signIdentityServiceRequest({ sdk })
    return await fetch(
      `${identityServiceUrl}/push_notifications/browser/deregister`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [AuthHeaders.Message]: data,
          [AuthHeaders.Signature]: signature
        },
        body: JSON.stringify({ subscription })
      }
    ).then((res) => res.json())
  }

  async function getPushNotificationSettings({ sdk }: { sdk: AudiusSdk }) {
    try {
      const { data, signature } = await signIdentityServiceRequest({ sdk })
      return await fetch(`${identityServiceUrl}/push_notifications/settings`, {
        headers: {
          [AuthHeaders.Message]: data,
          [AuthHeaders.Signature]: signature
        }
      })
        .then((res) => res.json())
        .then((res: { settings: PushNotifications }) => res.settings)
    } catch (e) {
      console.error(e)
      return null
    }
  }

  async function registerDeviceToken({
    sdk,
    deviceToken,
    deviceType
  }: {
    sdk: AudiusSdk
    deviceToken: string
    deviceType: string
  }) {
    try {
      const { data, signature } = await signIdentityServiceRequest({ sdk })
      return await fetch(
        `${identityServiceUrl}/push_notifications/device_token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            [AuthHeaders.Message]: data,
            [AuthHeaders.Signature]: signature
          },
          body: JSON.stringify({
            deviceToken,
            deviceType
          })
        }
      ).then((res) => res.json())
    } catch (e) {
      console.error(e)
    }
  }

  async function deregisterDeviceToken({
    sdk,
    deviceToken
  }: {
    sdk: AudiusSdk
    deviceToken: string
  }) {
    try {
      const { data, signature } = await signIdentityServiceRequest({ sdk })
      return await fetch(
        `${identityServiceUrl}/push_notifications/device_token/deregister`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            [AuthHeaders.Message]: data,
            [AuthHeaders.Signature]: signature
          },
          body: JSON.stringify({
            deviceToken
          })
        }
      ).then((res) => res.json())
    } catch (e) {
      console.error(e)
    }
  }

  async function updateUserLocationTimezone({ sdk }: { sdk: AudiusSdk }) {
    try {
      const { data, signature } = await signIdentityServiceRequest({ sdk })
      const timezone = dayjs.tz.guess()
      const res = await fetch(`${identityServiceUrl}/users/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [AuthHeaders.Message]: data,
          [AuthHeaders.Signature]: signature
        },
        body: JSON.stringify({ timezone })
      }).then((res) => res.json())
      return res
    } catch (e) {
      console.error(e)
    }
  }

  async function sendWelcomeEmail({
    sdk,
    name
  }: {
    sdk: AudiusSdk
    name: string
  }) {
    try {
      const { data, signature } = await signIdentityServiceRequest({ sdk })
      return await fetch(`${identityServiceUrl}/email/welcome`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [AuthHeaders.Message]: data,
          [AuthHeaders.Signature]: signature
        },
        body: JSON.stringify({ name, isNativeMobile: !!nativeMobile })
      }).then((res) => res.json())
    } catch (e) {
      console.error(e)
    }
  }

  async function updateUserEvent({
    sdk,
    hasSignedInNativeMobile
  }: {
    sdk: AudiusSdk
    hasSignedInNativeMobile: boolean
  }) {
    try {
      const { data, signature } = await signIdentityServiceRequest({ sdk })
      const res = await fetch(`${identityServiceUrl}/userEvents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [AuthHeaders.Message]: data,
          [AuthHeaders.Signature]: signature
        },
        body: JSON.stringify({ hasSignedInNativeMobile })
      }).then((res) => res.json())
      return res
    } catch (e) {
      console.error(e)
    }
  }

  async function updateHCaptchaScore({
    sdk,
    token
  }: {
    sdk: AudiusSdk
    token: string
  }) {
    try {
      const { data, signature } = await signIdentityServiceRequest({ sdk })
      return await fetch(`${identityServiceUrl}/score/hcaptcha`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [AuthHeaders.Message]: data,
          [AuthHeaders.Signature]: signature
        },
        body: JSON.stringify({ token })
      }).then((res) => res.json())
    } catch (err) {
      console.error(getErrorMessage(err))
      return { error: true }
    }
  }

  /**
   * Make a request to fetch the eth AUDIO balance of the the user
   * @params {bool} bustCache
   * @params {string} ethAddress - Optional ETH wallet address. Defaults to hedgehog wallet
   * @returns {Promise<BN | null>} balance or null if failed to fetch balance
   */
  async function getBalance({
    ethAddress,
    bustCache = false
  }: {
    ethAddress?: string
    bustCache?: boolean
  } = {}): Promise<BN | null> {
    await waitForLibsInit()

    const wallet =
      ethAddress !== undefined
        ? ethAddress
        : audiusLibs.web3Manager.getWalletAddress()
    if (!wallet) return null

    try {
      const ethWeb3 = audiusLibs.ethWeb3Manager.getWeb3()
      const checksumWallet = ethWeb3.utils.toChecksumAddress(wallet)
      if (bustCache) {
        audiusLibs.ethContracts.AudiusTokenClient.bustCache()
      }
      const balance = await audiusLibs.ethContracts.AudiusTokenClient.balanceOf(
        checksumWallet
      )
      return balance
    } catch (e) {
      console.error(e)
      reportError({ error: e as Error })
      return null
    }
  }

  /**
   * Make a request to fetch the sol wrapped audio balance of the the user
   * @params {string} ethAddress - Optional ETH wallet address to derive user bank. Defaults to hedgehog wallet
   * @returns {Promise<BN>} balance or null if failed to fetch balance
   */
  async function getWAudioBalance({
    ethAddress,
    sdk
  }: {
    ethAddress: string
    sdk: AudiusSdk
  }): Promise<BN | null> {
    try {
      const { userBank } =
        await sdk.services.claimableTokensClient.getOrCreateUserBank({
          ethWallet: ethAddress,
          mint: 'wAUDIO'
        })
      const connection = sdk.services.solanaClient.connection
      const {
        value: { amount }
      } = await connection.getTokenAccountBalance(userBank)
      const ownerWAudioBalance = AUDIO(wAUDIO(BigInt(amount))).value
      if (isNullOrUndefined(ownerWAudioBalance)) {
        throw new Error('Failed to fetch account waudio balance')
      }
      return new BN(ownerWAudioBalance.toString())
    } catch (e) {
      console.error(e)
      reportError({ error: e as Error })
      return null
    }
  }

  /**
   * Fetches the Sol balance for the given wallet address
   * @param {string} The solana wallet address
   * @returns {Promise<BNWei>}
   */
  async function getAddressSolBalance({
    address,
    sdk
  }: {
    address: string
    sdk: AudiusSdk
  }): Promise<BNWei> {
    try {
      const addressPubKey = new PublicKey(address)
      const connection = sdk.services.solanaClient.connection
      const solBalance = await connection.getBalance(addressPubKey)
      return new BN(solBalance ?? 0) as BNWei
    } catch (e) {
      reportError({ error: e as Error })
      return new BN(0) as BNWei
    }
  }

  /**
   * Make a request to fetch the balance, staked and delegated total of the wallet address
   * @params {string} address The wallet address to fetch the balance for
   * @params {bool} bustCache
   * @returns {Promise<BN | null>} balance or null if error
   */
  async function getAddressTotalStakedBalance(
    address: string,
    bustCache = false
  ) {
    await waitForLibsInit()
    if (!address) return null

    try {
      const ethWeb3 = audiusLibs.ethWeb3Manager.getWeb3()
      const checksumWallet = ethWeb3.utils.toChecksumAddress(address)
      if (bustCache) {
        audiusLibs.ethContracts.AudiusTokenClient.bustCache()
      }
      const balance = await audiusLibs.ethContracts.AudiusTokenClient.balanceOf(
        checksumWallet
      )
      const delegatedBalance =
        await audiusLibs.ethContracts.DelegateManagerClient.getTotalDelegatorStake(
          checksumWallet
        )
      const stakedBalance =
        await audiusLibs.ethContracts.StakingProxyClient.totalStakedFor(
          checksumWallet
        )

      return balance.add(delegatedBalance).add(stakedBalance)
    } catch (e) {
      reportError({ error: e as Error })
      console.error(e)
      return null
    }
  }

  /**
   * Make a request to send
   */
  async function sendTokens(address: string, amount: BNWei) {
    await waitForLibsInit()
    const receipt = await audiusLibs.Account.permitAndSendTokens(
      address,
      amount
    )
    return receipt
  }

  /** Gets associated token account info for the passed account. It will
   * first check if `address` ia a token account. If not, it will assume
   * it is a root account and attempt to derive an associated token account from it.
   */
  async function getAssociatedTokenAccountInfo({
    address,
    sdk
  }: {
    address: string
    sdk: AudiusSdk
  }) {
    const connection = sdk.services.solanaClient.connection
    const pubkey = new PublicKey(address)
    try {
      return await getAccount(connection, pubkey)
    } catch (err) {
      // Account exists but is not a token account. Assume it's a root account
      // and try to derive an associated account from it.
      if (err instanceof TokenInvalidAccountOwnerError) {
        console.info(
          'Provided recipient solana address was not a token account. Assuming root account.'
        )
        const associatedTokenAccount = findAssociatedTokenAddress({
          solanaWalletKey: pubkey,
          mint: 'wAUDIO'
        })
        return await getAccount(connection, associatedTokenAccount)
      }
      // Other error (including non-existent account)
      throw err
    }
  }

  async function createAssociatedTokenAccountWithPhantom(
    connection: Connection,
    address: string
  ) {
    if (!window.phantom) {
      throw new Error(
        'Recipient has no $AUDIO token account. Please install Phantom-Wallet to create one.'
      )
    }

    if (!window.solana.isConnected) {
      await window.solana.connect()
    }

    const newAccountKey = new PublicKey(address)
    const phantomWalletKey = window.solana.publicKey
    if (!phantomWalletKey) {
      throw new Error('Failed to resolve Phantom wallet')
    }
    const tx = await getCreateAssociatedTokenAccountTransaction({
      feePayerKey: phantomWalletKey,
      solanaWalletKey: newAccountKey,
      mint: 'wAUDIO',
      solanaTokenProgramKey: new PublicKey(TOKEN_PROGRAM_ID),
      connection
    })
    const { signature, lastValidBlockHeight, recentBlockhash } =
      await window.solana.signAndSendTransaction(tx)
    if (!signature || !lastValidBlockHeight || !recentBlockhash) {
      throw new Error('Phantom failed to sign and send transaction')
    }
    await connection.confirmTransaction({
      signature: signature.toString(),
      lastValidBlockHeight,
      blockhash: recentBlockhash
    })
    return getAccount(connection, newAccountKey)
  }

  /** Gets associated token account info for the passed account, deriving the associated address
   * if necessary. If the account doesn't exist, it will attempt to create it using the user's
   * browser wallet.
   */
  async function getOrCreateAssociatedTokenAccountInfo({
    address,
    sdk
  }: {
    address: string
    sdk: AudiusSdk
  }) {
    const connection = sdk.services.solanaClient.connection
    const pubkey = new PublicKey(address)
    try {
      return await getAccount(connection, pubkey)
    } catch (err) {
      // Account exists but is not a token account. Assume it's a root account
      // and try to derive an associated account from it.
      if (err instanceof TokenInvalidAccountOwnerError) {
        console.info(
          'Provided recipient solana address was not a token account. Assuming root account.'
        )
        const associatedTokenAccount = findAssociatedTokenAddress({
          solanaWalletKey: pubkey,
          mint: 'wAUDIO'
        })
        // Atempt to get the associated token account
        try {
          return await getAccount(connection, associatedTokenAccount)
        } catch (err) {
          // If it's not a valid token account, attempt to create it
          if (err instanceof TokenAccountNotFoundError) {
            // We do not want to relay gas fees for this token account creation,
            // so we ask the user to create one with phantom, showing an error
            // if phantom is not found.
            return createAssociatedTokenAccountWithPhantom(connection, address)
          }
          throw err
        }
      }
      // Other error (including non-existent account)
      throw err
    }
  }

  /**
   * Make a request to send solana wrapped audio
   */
  async function sendWAudioTokens({
    address,
    amount,
    ethAddress,
    sdk
  }: {
    address: string
    amount: BNWei
    ethAddress: string
    sdk: AudiusSdk
  }) {
    // TODO: Verify mint is wAUDIO
    const tokenAccountInfo = await getOrCreateAssociatedTokenAccountInfo({
      address,
      sdk
    })

    const res = await transferWAudio({
      destination: tokenAccountInfo.address,
      amount,
      ethAddress,
      sdk
    })
    return { res, error: null }
  }

  async function transferWAudio({
    ethAddress,
    destination,
    amount,
    sdk
  }: {
    ethAddress: string
    destination: PublicKey
    amount: BN
    sdk: AudiusSdk
  }) {
    console.info(
      `Transferring ${amount.toString()} wei $AUDIO to ${destination.toBase58()}`
    )

    const wAudioAmount = wAUDIO(AUDIO(amount))
    const secpTransactionInstruction =
      await sdk.services.claimableTokensClient.createTransferSecpInstruction({
        amount: wAudioAmount.value,
        ethWallet: ethAddress,
        mint: 'wAUDIO',
        destination
      })
    const transferInstruction =
      await sdk.services.claimableTokensClient.createTransferInstruction({
        ethWallet: ethAddress,
        mint: 'wAUDIO',
        destination
      })
    const transaction = await sdk.services.solanaClient.buildTransaction({
      instructions: [secpTransactionInstruction, transferInstruction]
    })
    const signature = await sdk.services.claimableTokensClient.sendTransaction(
      transaction
    )
    return signature
  }

  async function getSignature({ data, sdk }: { data: any; sdk: AudiusSdk }) {
    return signData({ data, sdk })
  }

  /**
   * Transfers the user's ERC20 AUDIO into SPL WAUDIO to their solana user bank account
   * @param {BN} balance The amount of AUDIO to be transferred
   * @returns {
   *   txSignature: string
   *   phase: string
   *   error: error | null
   *   logs: Array<string>
   * }
   */
  async function transferAudioToWAudio(balance: BN) {
    await waitForLibsInit()
    const userBank = await audiusLibs.solanaWeb3Manager.deriveUserBank()
    return audiusLibs.Account.proxySendTokensFromEthToSol(
      balance,
      userBank.toString()
    )
  }

  /**
   * Fetches the SPL WAUDIO balance for the user's solana wallet address
   * @param {string} The solana wallet address
   * @returns {Promise<wAUDIO | null>} Returns the balance, 0 for non-existent token accounts
   */
  async function getAddressWAudioBalance({
    address,
    sdk
  }: {
    address: string
    sdk: AudiusSdk
  }) {
    try {
      const { amount } = await getAssociatedTokenAccountInfo({
        address,
        sdk
      })
      return wAUDIO(amount).value
    } catch (err) {
      // Non-existent token accounts indicate 0 balance. Other errors fall through
      if (err instanceof TokenAccountNotFoundError) {
        return wAUDIO(0).value
      }
      throw err
    }
  }

  async function getAudiusLibs() {
    await waitForLibsInit()
    return audiusLibs
  }

  async function getAudiusLibsTyped() {
    await waitForLibsInit()
    return audiusLibs as AudiusLibsType
  }

  async function getWeb3() {
    const audiusLibs = await getAudiusLibs()
    return audiusLibs.web3Manager.getWeb3()
  }

  async function setUserHandleForRelay(handle: string) {
    const audiusLibs = await getAudiusLibs()
    audiusLibs.web3Manager.setUserSuppliedHandle(handle)
  }

  /**
   * Finds the associated token address given a solana wallet public key
   * @param solanaWalletKey Public Key for a given solana account (a wallet)
   * @param mintKey
   * @returns token account public key
   */
  function findAssociatedTokenAddress({
    solanaWalletKey,
    mint
  }: {
    solanaWalletKey: PublicKey
    mint: MintName
  }) {
    const solanaTokenProgramKey = new PublicKey(TOKEN_PROGRAM_ID)
    const mintKey =
      mint === 'wAUDIO'
        ? new PublicKey(env.WAUDIO_MINT_ADDRESS)
        : new PublicKey(env.USDC_MINT_ADDRESS)
    const addresses = PublicKey.findProgramAddressSync(
      [
        solanaWalletKey.toBuffer(),
        solanaTokenProgramKey.toBuffer(),
        mintKey.toBuffer()
      ],
      ASSOCIATED_TOKEN_PROGRAM_ID
    )
    return addresses[0]
  }

  /**
   * Creates an associated token account for a given solana account (a wallet)
   * @param feePayerKey
   * @param solanaWalletKey the wallet we wish to create a token account for
   * @param mintKey
   * @param solanaTokenProgramKey
   * @param connection
   * @param identityService
   */
  async function getCreateAssociatedTokenAccountTransaction({
    feePayerKey,
    solanaWalletKey,
    mint,
    solanaTokenProgramKey,
    connection
  }: {
    feePayerKey: PublicKey
    solanaWalletKey: PublicKey
    mint: MintName
    solanaTokenProgramKey: PublicKey
    connection: Connection
  }) {
    const associatedTokenAddress = findAssociatedTokenAddress({
      solanaWalletKey,
      mint
    })
    const mintKey =
      mint === 'wAUDIO'
        ? new PublicKey(env.WAUDIO_MINT_ADDRESS)
        : new PublicKey(env.USDC_MINT_ADDRESS)
    const accounts = [
      // 0. `[sw]` Funding account (must be a system account)
      {
        pubkey: feePayerKey,
        isSigner: true,
        isWritable: true
      },
      // 1. `[w]` Associated token account address to be created
      {
        pubkey: associatedTokenAddress,
        isSigner: false,
        isWritable: true
      },
      // 2. `[r]` Wallet address for the new associated token account
      {
        pubkey: solanaWalletKey,
        isSigner: false,
        isWritable: false
      },
      // 3. `[r]` The token mint for the new associated token account
      {
        pubkey: mintKey,
        isSigner: false,
        isWritable: false
      },
      // 4. `[r]` System program
      {
        pubkey: SystemProgram.programId,
        isSigner: false,
        isWritable: false
      },
      // 5. `[r]` SPL Token program
      {
        pubkey: solanaTokenProgramKey,
        isSigner: false,
        isWritable: false
      },
      // 6. `[r]` Rent sysvar
      {
        pubkey: SYSVAR_RENT_PUBKEY,
        isSigner: false,
        isWritable: false
      }
    ]

    const { blockhash } = await connection.getLatestBlockhash('confirmed')
    const instr = new TransactionInstruction({
      keys: accounts.map((account) => ({
        pubkey: account.pubkey,
        isSigner: account.isSigner,
        isWritable: account.isWritable
      })),
      programId: ASSOCIATED_TOKEN_PROGRAM_ID,
      data: Buffer.from([])
    })
    const tx = new Transaction({ recentBlockhash: blockhash })
    tx.feePayer = feePayerKey
    tx.add(instr)
    return tx
  }

  return {
    addDiscoveryProviderSelectionListener,
    audiusLibs: audiusLibs as AudiusLibsType,
    clearNotificationBadges,
    currentDiscoveryProvider,
    deregisterDeviceToken,
    didSelectDiscoveryProviderListeners,
    disableBrowserNotifications,
    fetchUserAssociatedWallets,
    findAssociatedTokenAddress,
    getAddressTotalStakedBalance,
    getAddressWAudioBalance,
    getAddressSolBalance,
    getAssociatedTokenAccountInfo,
    getAudiusLibs,
    getAudiusLibsTyped,
    getBalance,
    getBrowserPushNotificationSettings,
    getBrowserPushSubscription,
    getEmailNotificationSettings,
    getPushNotificationSettings,
    getSafariBrowserPushEnabled,
    getSignature,
    getUserListenCountsMonthly,
    getWAudioBalance,
    getWeb3,
    identityServiceUrl,
    recordTrackListen,
    registerDeviceToken,
    sendTokens,
    sendWAudioTokens,
    sendWelcomeEmail,
    setup,
    setUserHandleForRelay,
    signData,
    signGatedContentRequest,
    signDiscoveryNodeRequest,
    signIdentityServiceRequest,
    transferAudioToWAudio,
    instagramHandle,
    tiktokHandle,
    updateBrowserNotifications,
    updateCreator,
    updateEmailNotificationSettings,
    updateHCaptchaScore,
    updateNotificationSettings,
    updatePushNotificationSettings,
    updateUserEvent,
    updateUserLocationTimezone,
    uploadImage,
    userNodeUrl,
    waitForLibsInit,
    waitForWeb3
  }
}

export type AudiusBackend = ReturnType<typeof audiusBackend>
