import { AUDIO, wAUDIO } from '@audius/fixed-decimal'
import {
  AudiusSdk,
  Genre,
  Mood,
  type StorageNodeSelectorService
} from '@audius/sdk'
import type { HedgehogConfig } from '@audius/sdk-legacy/dist/services/hedgehog'
import type { LocalStorage } from '@audius/sdk-legacy/dist/utils/localStorage'
import { PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js'
import BN from 'bn.js'

import { userMetadataToSdk } from '~/adapters/user'
import { Env } from '~/services/env'
import dayjs from '~/utils/dayjs'

import {
  BNWei,
  Collection,
  ID,
  InstagramUser,
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
  RemoteConfigInstance
} from '../../services/remote-config'
import {
  BrowserNotificationSetting,
  PushNotificationSetting,
  PushNotifications,
  SearchKind
} from '../../store'
import {
  getErrorMessage,
  uuid,
  Maybe,
  Nullable,
  isNullOrUndefined
} from '../../utils'
import type { DiscoveryNodeSelectorService } from '../sdk/discovery-node-selector'

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
  getStorageNodeSelector: () => Promise<StorageNodeSelectorService>
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
  waitForWeb3: () => Promise<void>
  web3NetworkId: Maybe<string>
  web3ProviderUrls: Maybe<string[]>
  wormholeConfig: AudiusBackendWormholeConfig
}

export const audiusBackend = ({
  identityServiceUrl,
  generalAdmissionUrl,
  nativeMobile,
  reportError,
  userNodeUrl,
  waitForWeb3
}: AudiusBackendParams) => {
  const currentDiscoveryProvider: Nullable<string> = null
  const didSelectDiscoveryProviderListeners: DiscoveryProviderListener[] = []

  function addDiscoveryProviderSelectionListener(
    listener: DiscoveryProviderListener
  ) {
    didSelectDiscoveryProviderListeners.push(listener)
    if (currentDiscoveryProvider !== null) {
      listener(currentDiscoveryProvider)
    }
  }

  type SearchTagsArgs = {
    query: string
    userTagCount?: number
    kind?: SearchKind
    limit?: number
    offset?: number
    genre?: Genre
    mood?: Mood
    bpmMin?: number
    bpmMax?: number
    key?: string
    isVerified?: boolean
    hasDownloads?: boolean
    isPremium?: boolean
    sortMethod?: 'recent' | 'relevant' | 'popular'
  }

  async function searchTags({
    query,
    userTagCount,
    kind,
    offset,
    limit,
    genre,
    mood,
    bpmMin,
    bpmMax,
    key,
    isVerified,
    hasDownloads,
    isPremium,
    sortMethod
  }: SearchTagsArgs) {
    throw new Error('Not implemented')
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

  async function repostCollection(
    playlistId: ID,
    metadata?: { is_repost_of_repost: boolean }
  ) {
    throw new Error('Not implemented')
  }

  async function undoRepostCollection(playlistId: ID) {
    throw new Error('Not implemented')
  }

  async function uploadImage(file: File) {
    throw new Error('Not implemented')
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
      newMetadata.associated_wallets || associatedWallets?.associated_wallets
    // @ts-ignore when writing data, this type is expected to contain a signature
    newMetadata.associated_sol_wallets =
      newMetadata.associated_sol_wallets ||
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

  async function createPlaylist(
    playlistId: ID,
    metadata: Partial<Collection>,
    isAlbum = false,
    trackIds: ID[] = [],
    isPrivate = true
  ) {
    throw new Error('Not implemented')
  }

  async function updatePlaylist(metadata: Collection) {
    throw new Error('Not implemented')
  }

  async function orderPlaylist(playlist: any) {
    throw new Error('Not implemented')
  }

  async function publishPlaylist(playlist: Collection) {
    throw new Error('Not implemented')
  }

  async function addPlaylistTrack(playlist: Collection) {
    throw new Error('Not implemented')
  }

  async function deletePlaylistTrack(playlist: Collection) {
    throw new Error('Not implemented')
  }

  async function deletePlaylist(playlistId: ID) {
    throw new Error('Not implemented')
  }

  // Favorite a playlist
  async function saveCollection(
    playlistId: ID,
    metadata?: { is_save_of_repost: boolean }
  ) {
    throw new Error('Not implemented')
  }

  // Unfavorite a playlist
  async function unsaveCollection(playlistId: ID) {
    throw new Error('Not implemented')
  }

  async function guestSignUp(email: string) {
    throw new Error('Not implemented')
  }

  async function sendRecoveryEmail(handle: string) {
    throw new Error('Not implemented')
  }

  async function emailInUse(email: string) {
    throw new Error('Not implemented')
  }

  async function twitterHandle(handle: string) {
    throw new Error('Not implemented')
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

  async function associateTwitterAccount(
    twitterId: string,
    userId: ID,
    handle: string,
    blockNumber: number
  ) {
    throw new Error('Not implemented')
  }

  async function associateInstagramAccount(
    instagramId: string,
    userId: ID,
    handle: string,
    blockNumber: number
  ) {
    throw new Error('Not implemented')
  }

  async function associateTikTokAccount(
    tikTokId: string,
    userId: ID,
    handle: string,
    blockNumber: number
  ) {
    throw new Error('Not implemented')
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
    throw new Error('Not implemented')
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
    throw new Error('Not implemented')
  }

  /**
   * Make a request to send
   */
  async function sendTokens(address: string, amount: BNWei) {
    throw new Error('Not implemented')
  }

  /**
   * Make a request to send solana wrapped audio
   */
  async function sendWAudioTokens(address: string, amount: BNWei) {
    throw new Error('Not implemented')
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
    throw new Error('Not implemented')
  }

  /**
   * Fetches the SPL WAUDIO balance for the user's solana wallet address
   * @param {string} The solana wallet address
   * @returns {Promise<BN | null>} Returns the balance, or null if error
   */
  async function getAddressWAudioBalance(address: string) {
    throw new Error('Not implemented')
  }

  return {
    addDiscoveryProviderSelectionListener,
    addPlaylistTrack,
    associateInstagramAccount,
    associateTwitterAccount,
    associateTikTokAccount,
    clearNotificationBadges,
    createPlaylist,
    currentDiscoveryProvider,
    deletePlaylist,
    deletePlaylistTrack,
    deregisterDeviceToken,
    didSelectDiscoveryProviderListeners,
    disableBrowserNotifications,
    emailInUse,
    fetchUserAssociatedWallets,
    getAddressTotalStakedBalance,
    getAddressWAudioBalance,
    getAddressSolBalance,
    getBalance,
    getBrowserPushNotificationSettings,
    getBrowserPushSubscription,
    getEmailNotificationSettings,
    getPushNotificationSettings,
    getSafariBrowserPushEnabled,
    getSignature,
    getWAudioBalance,
    identityServiceUrl,
    orderPlaylist,
    publishPlaylist,
    recordTrackListen,
    registerDeviceToken,
    repostCollection,
    guestSignUp,
    saveCollection,
    searchTags,
    sendRecoveryEmail,
    sendTokens,
    sendWAudioTokens,
    sendWelcomeEmail,
    signData,
    signDiscoveryNodeRequest,
    signIdentityServiceRequest,
    transferAudioToWAudio,
    twitterHandle,
    instagramHandle,
    tiktokHandle,
    undoRepostCollection,
    unsaveCollection,
    updateBrowserNotifications,
    updateCreator,
    updateEmailNotificationSettings,
    updateHCaptchaScore,
    updateNotificationSettings,
    updatePlaylist,
    updatePushNotificationSettings,
    updateUserEvent,
    updateUserLocationTimezone,
    uploadImage,
    userNodeUrl,
    waitForWeb3
  }
}

export type AudiusBackend = ReturnType<typeof audiusBackend>
