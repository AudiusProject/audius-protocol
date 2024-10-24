import {
  Genre,
  Mood,
  type DiscoveryNodeSelector,
  type StorageNodeSelectorService
} from '@audius/sdk'
import { DiscoveryAPI } from '@audius/sdk-legacy/dist/core'
import { type AudiusLibs as AudiusLibsType } from '@audius/sdk-legacy/dist/libs'
import type { HedgehogConfig } from '@audius/sdk-legacy/dist/services/hedgehog'
import type { LocalStorage } from '@audius/sdk-legacy/dist/utils/localStorage'
import { ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token'
import {
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
  TransactionInstruction,
  VersionedTransaction
} from '@solana/web3.js'
import BN from 'bn.js'

import { Env } from '~/services/env'
import dayjs from '~/utils/dayjs'

import placeholderCoverArt from '../../assets/img/imageBlank2x.png'
import imageCoverPhotoBlank from '../../assets/img/imageCoverPhotoBlank.jpg'
import placeholderProfilePicture from '../../assets/img/imageProfilePicEmpty2X.png'
import {
  BNWei,
  CID,
  Collection,
  CollectionMetadata,
  CoverArtSizes,
  CoverPhotoSizes,
  DefaultSizes,
  ID,
  InstagramUser,
  Name,
  ProfilePictureSizes,
  SquareSizes,
  TikTokUser,
  Track,
  TrackMetadata,
  TwitterUser,
  User,
  UserMetadata,
  UserCollection,
  WidthSizes,
  ComputedUserProperties
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
  PushNotifications,
  TrackMetadataForUpload,
  SearchKind
} from '../../store'
import {
  getErrorMessage,
  uuid,
  Maybe,
  encodeHashId,
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

const SEARCH_MAX_SAVED_RESULTS = 10
const SEARCH_MAX_TOTAL_RESULTS = 50

export const AuthHeaders = Object.freeze({
  Message: 'Encoded-Data-Message',
  Signature: 'Encoded-Data-Signature'
})

// TODO: type these once libs types are improved
let AudiusLibs: any = null
export let BackendUtils: any = null
let SanityChecks: any = null
let SolanaUtils: any = null

let audiusLibs: any = null
const unauthenticatedUuid = uuid()
/**
 * Combines two lists by concatting `maxSaved` results from the `savedList` onto the head of `normalList`,
 * ensuring that no item is duplicated in the resulting list (deduped by `uniqueKey`). The final list length is capped
 * at `maxTotal` items.
 */
const combineLists = <Entity extends Track | User>(
  savedList: Entity[],
  normalList: Entity[],
  uniqueKey: keyof Entity,
  maxSaved = SEARCH_MAX_SAVED_RESULTS,
  maxTotal = SEARCH_MAX_TOTAL_RESULTS
) => {
  const truncatedSavedList = savedList.slice(
    0,
    Math.min(maxSaved, savedList.length)
  )
  const saveListsSet = new Set(truncatedSavedList.map((s) => s[uniqueKey]))
  const filteredList = normalList.filter((n) => !saveListsSet.has(n[uniqueKey]))
  const combinedLists = savedList.concat(filteredList)
  return combinedLists.slice(0, Math.min(maxTotal, combinedLists.length))
}

const notDeleted = (e: { is_delete: boolean }) => !e.is_delete

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
  imagePreloader: (url: string) => Promise<boolean>
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
  imagePreloader,
  env,
  ethOwnerWallet,
  ethProviderUrls,
  ethRegistryAddress,
  ethTokenAddress,
  discoveryNodeSelectorService,
  getFeatureEnabled,
  getHostUrl,
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
  setLocalStorageItem,
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

  async function fetchCID(cid: CID, asUrl = true) {
    await waitForLibsInit()

    // If requesting a url (we mean a blob url for the file),
    // otherwise, default to JSON
    const responseType = asUrl ? 'blob' : 'json'

    try {
      const res = await audiusLibs.File.fetchCIDFromDiscovery(cid, responseType)
      if (asUrl) {
        const url = nativeMobile
          ? res.config.url
          : URL.createObjectURL(res.data)
        return url
      }
      return res?.data ?? null
    } catch (e) {
      const message = getErrorMessage(e)
      if (message === 'Unauthorized') {
        return message
      }
      console.error(e)
      return asUrl ? '' : null
    }
  }

  async function fetchImageCID(
    cid: CID,
    size?: SquareSizes | WidthSizes,
    cidMap: Nullable<{ [key: string]: string }> = null
  ) {
    let cidFileName = size ? `${cid}/${size}.jpg` : `${cid}.jpg`
    // For v2 CIDs (aka job IDs), cidMap contains cids for each
    // image variant. Use the CID for the desired image
    // size from this map to accurately select the preferred
    // rendezvous node to query.
    if (size && cidMap && cidMap[size]) {
      cidFileName = cidMap[size]
    }

    const storageNodeSelector = await getStorageNodeSelector()
    // Only rendezvous hash the cid for extremely old legacy
    // images that do not have size variants
    const cidToHash = size ? cidFileName : cid
    const storageNodes = storageNodeSelector.getNodes(cidToHash)
    for (const storageNode of storageNodes) {
      const imageUrl = `${storageNode}/content/${cidFileName}`

      const preloaded = await imagePreloader(imageUrl)
      if (preloaded) {
        return imageUrl
      }
    }
    return ''
  }

  async function getImageUrl(
    cid: Nullable<CID>,
    size?: SquareSizes | WidthSizes,
    cidMap: Nullable<{ [key: string]: string }> = null
  ) {
    if (!cid) return ''
    try {
      return await fetchImageCID(cid, size, cidMap)
    } catch (e) {
      console.error(e)
      return ''
    }
  }

  function getTrackImages(track: TrackMetadata): Track {
    const coverArtSizes: CoverArtSizes = {}
    if (!track.cover_art_sizes && !track.cover_art) {
      coverArtSizes[DefaultSizes.OVERRIDE] = placeholderCoverArt as string
    }

    return {
      ...track,
      // TODO: This method should be renamed as it does more than images.
      duration:
        track.duration ||
        track.track_segments.reduce(
          (duration, segment) => duration + parseFloat(segment.duration),
          0
        ),
      _cover_art_sizes: coverArtSizes
    }
  }

  function getCollectionImages(collection: CollectionMetadata) {
    const coverArtSizes: CoverArtSizes = {}

    if (
      collection.playlist_image_sizes_multihash &&
      !collection.cover_art_sizes
    ) {
      collection.cover_art_sizes = collection.playlist_image_sizes_multihash
    }
    if (collection.playlist_image_multihash && !collection.cover_art) {
      collection.cover_art = collection.playlist_image_multihash
    }

    if (!collection.cover_art_sizes && !collection.cover_art) {
      coverArtSizes[DefaultSizes.OVERRIDE] = placeholderCoverArt as
        | string
        | number // ReactNative require() is a number for images!
    }

    return {
      ...collection,
      _cover_art_sizes: coverArtSizes
    }
  }

  function getUserImages(user: UserMetadata) {
    const profilePictureSizes: ProfilePictureSizes = {}
    const coverPhotoSizes: CoverPhotoSizes = {}

    // Images are fetched on demand async w/ the `useUserProfilePicture`/`useUserCoverPhoto` and
    // transitioned in w/ the dynamicImageComponent
    if (!user.profile_picture_sizes && !user.profile_picture) {
      profilePictureSizes[DefaultSizes.OVERRIDE] =
        placeholderProfilePicture as string
    }

    if (!user.cover_photo_sizes && !user.cover_photo) {
      coverPhotoSizes[DefaultSizes.OVERRIDE] = imageCoverPhotoBlank as string
    }

    return {
      ...user,
      _profile_picture_sizes: profilePictureSizes,
      _cover_photo_sizes: coverPhotoSizes
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

  async function sanityChecks(
    audiusLibs: any,
    args: { wallet?: string; handle?: string }
  ) {
    try {
      const sanityChecks = new SanityChecks(audiusLibs)
      await sanityChecks.run(args)
    } catch (e) {
      console.error(`Sanity checks failed: ${e}`)
    }
  }

  async function setup({
    wallet,
    userId,
    handle
  }: {
    wallet?: string
    userId?: number
    handle?: string
  }) {
    // Wait for web3 to load if necessary
    await waitForWeb3()
    // Wait for optimizely to load if necessary
    await waitForRemoteConfig()

    const libsModule = await getLibs()

    AudiusLibs = libsModule.AudiusLibs
    BackendUtils = libsModule.Utils
    SanityChecks = libsModule.SanityChecks
    SolanaUtils = libsModule.SolanaUtils
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

    const useSdkDiscoveryNodeSelector = await getFeatureEnabled(
      FeatureFlags.SDK_DISCOVERY_NODE_SELECTOR
    )

    let discoveryNodeSelector: Maybe<DiscoveryNodeSelector>

    if (useSdkDiscoveryNodeSelector) {
      discoveryNodeSelector = await discoveryNodeSelectorService.getInstance()

      const initialSelectedNode: string | undefined =
        // TODO: Need a synchronous method to check if a discovery node is already selected?
        // Alternatively, remove all this AudiusBackend/Libs init/APIClient init stuff in favor of SDK
        // @ts-ignore config is private
        discoveryNodeSelector.config.initialSelectedNode
      if (initialSelectedNode) {
        discoveryProviderSelectionCallback(initialSelectedNode, [])
      }
      discoveryNodeSelector.addEventListener('change', (endpoint) => {
        console.debug('[AudiusBackend] DiscoveryNodeSelector changed', endpoint)
        discoveryProviderSelectionCallback(endpoint, [])
      })
    }

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
        preferHigherPatchForPrimary: await getFeatureEnabled(
          FeatureFlags.PREFER_HIGHER_PATCH_FOR_PRIMARY
        ),
        preferHigherPatchForSecondaries: await getFeatureEnabled(
          FeatureFlags.PREFER_HIGHER_PATCH_FOR_SECONDARIES
        ),
        hedgehogConfig
      })
      await newAudiusLibs.init()
      audiusLibs = newAudiusLibs
      onLibsInit(audiusLibs)
      audiusLibs.web3Manager.discoveryProvider = audiusLibs.discoveryProvider

      sanityChecks(audiusLibs, { wallet, handle })
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

  async function setCreatorNodeEndpoint(endpoint: string) {
    return audiusLibs.creatorNode.setEndpoint(endpoint)
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
    try {
      const searchTags = await withEagerOption(
        {
          normal: (libs) => libs.Account.searchTags,
          eager: DiscoveryAPI.searchTags
        },
        query,
        userTagCount,
        kind,
        limit,
        offset,
        genre,
        mood,
        bpmMin,
        bpmMax,
        key,
        isVerified,
        hasDownloads,
        isPremium,
        sortMethod
      )

      const {
        tracks = [],
        saved_tracks: savedTracks = [],
        followed_users: followedUsers = [],
        users = [],
        playlists = [],
        albums = []
      } = searchTags

      const combinedTracks = await Promise.all(
        combineLists<Track>(
          savedTracks.filter(notDeleted),
          tracks.filter(notDeleted),
          'track_id'
        ).map(async (track) => getTrackImages(track))
      )

      const combinedUsers = await Promise.all(
        combineLists<User>(followedUsers, users, 'user_id').map(async (user) =>
          getUserImages(user)
        )
      )

      return {
        tracks: combinedTracks,
        users: combinedUsers,
        playlists: playlists as UserCollection[],
        albums: albums as UserCollection[]
      }
    } catch (e) {
      console.error(e)
      return {
        tracks: [],
        users: [],
        playlists: [],
        albums: []
      }
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
        encodeHashId(currentUserId),
        startTime,
        endTime
      )
      return userListenCountsMonthly
    } catch (e) {
      console.error(getErrorMessage(e))
      return []
    }
  }

  async function recordTrackListen(trackId: ID) {
    try {
      const listen = await audiusLibs.Track.logTrackListen(
        trackId,
        unauthenticatedUuid,
        await getFeatureEnabled(FeatureFlags.SOLANA_LISTEN_ENABLED)
      )
      return listen
    } catch (err) {
      console.error(getErrorMessage(err))
    }
  }

  async function repostTrack(
    trackId: ID,
    metadata?: { is_repost_of_repost: boolean }
  ) {
    try {
      return await audiusLibs.EntityManager.repostTrack(
        trackId,
        JSON.stringify(metadata)
      )
    } catch (err) {
      console.error(getErrorMessage(err))
      throw err
    }
  }

  async function undoRepostTrack(trackId: ID) {
    try {
      return await audiusLibs.EntityManager.unrepostTrack(trackId)
    } catch (err) {
      console.error(getErrorMessage(err))
      throw err
    }
  }

  async function repostCollection(
    playlistId: ID,
    metadata?: { is_repost_of_repost: boolean }
  ) {
    try {
      return audiusLibs.EntityManager.repostPlaylist(
        playlistId,
        JSON.stringify(metadata)
      )
    } catch (err) {
      console.error(getErrorMessage(err))
      throw err
    }
  }

  async function undoRepostCollection(playlistId: ID) {
    try {
      return audiusLibs.EntityManager.unrepostPlaylist(playlistId)
    } catch (err) {
      console.error(getErrorMessage(err))
      throw err
    }
  }

  async function getUserEmail(): Promise<string> {
    await waitForLibsInit()
    const { email } = await audiusLibs.Account.getUserEmail()
    return email
  }

  async function uploadImage(file: File) {
    return await audiusLibs.creatorNode.uploadTrackCoverArtV2(file, () => {})
  }

  async function updateTrack(
    _trackId: ID,
    metadata: TrackMetadata | TrackMetadataForUpload,
    transcodePreview?: boolean
  ) {
    const cleanedMetadata = schemas.newTrackMetadata(metadata, true)
    if ('artwork' in metadata && metadata.artwork) {
      const resp = await audiusLibs.creatorNode.uploadTrackCoverArtV2(
        metadata.artwork.file,
        () => {}
      )
      cleanedMetadata.cover_art_sizes = resp.id
    }
    return await audiusLibs.Track.updateTrackV2(
      cleanedMetadata,
      transcodePreview
    )
  }

  // TODO(C-2719)
  async function getCreators(ids: ID[]) {
    try {
      if (ids.length === 0) return []
      const creators: User[] = await withEagerOption(
        {
          normal: (libs) => libs.User.getUsers,
          eager: DiscoveryAPI.getUsers
        },
        ids.length,
        0,
        ids
      )
      if (!creators) {
        return []
      }

      return Promise.all(
        creators.map(async (creator: User) => getUserImages(creator))
      )
    } catch (err) {
      console.error(getErrorMessage(err))
      return []
    }
  }

  /**
   * Retrieves the user's eth associated wallets from IPFS using the user's metadata CID and creator node endpoints
   * @param user The user metadata which contains the CID for the metadata multihash
   * @returns Object The associated wallets mapping of address to nested signature
   */
  // TODO(C-2719)
  async function fetchUserAssociatedEthWallets(user: User) {
    const cid = user?.metadata_multihash ?? null
    if (cid) {
      const metadata = await fetchCID(cid, /* asUrl */ false)
      if (metadata?.associated_wallets) {
        return metadata.associated_wallets
      }
    }
    return null
  }

  /**
   * Retrieves the user's solana associated wallets from IPFS using the user's metadata CID and creator node endpoints
   * @param user The user metadata which contains the CID for the metadata multihash
   * @returns Object The associated wallets mapping of address to nested signature
   */
  // TODO(C-2719)
  async function fetchUserAssociatedSolWallets(user: User) {
    const cid = user?.metadata_multihash ?? null
    if (cid) {
      const metadata = await fetchCID(cid, /* asUrl */ false)
      if (metadata?.associated_sol_wallets) {
        return metadata.associated_sol_wallets
      }
    }
    return null
  }

  /**
   * Retrieves both the user's ETH and SOL associated wallets from the user's metadata CID
   * @param user The user metadata which contains the CID for the metadata multihash
   * @returns Object The associated wallets mapping of address to nested signature
   */
  // TODO(C-2719)
  async function fetchUserAssociatedWallets(user: UserMetadata) {
    const cid = user?.metadata_multihash ?? null
    if (cid) {
      const metadata = await fetchCID(cid, /* asUrl */ false)
      return {
        associated_sol_wallets: metadata?.associated_sol_wallets ?? null,
        associated_wallets: metadata?.associated_wallets ?? null
      }
    }
    return null
  }

  async function updateCreator(
    metadata: UserMetadata &
      Pick<
        ComputedUserProperties,
        'updatedProfilePicture' | 'updatedCoverPhoto'
      >,
    _id?: ID
  ) {
    let newMetadata = { ...metadata }
    const associatedWallets = await fetchUserAssociatedWallets(metadata)
    newMetadata.associated_wallets =
      newMetadata.associated_wallets || associatedWallets?.associated_wallets
    newMetadata.associated_sol_wallets =
      newMetadata.associated_sol_wallets ||
      associatedWallets?.associated_sol_wallets

    try {
      if (newMetadata.updatedProfilePicture) {
        const resp = await audiusLibs.creatorNode.uploadProfilePictureV2(
          newMetadata.updatedProfilePicture.file
        )
        newMetadata.profile_picture_sizes = resp.id
      }

      if (newMetadata.updatedCoverPhoto) {
        const resp = await audiusLibs.creatorNode.uploadCoverPhotoV2(
          newMetadata.updatedCoverPhoto.file
        )
        newMetadata.cover_photo_sizes = resp.id
      }

      newMetadata = schemas.newUserMetadata(newMetadata, true)
      const userId = newMetadata.user_id
      const { blockHash, blockNumber } = await audiusLibs.User.updateMetadataV2(
        { newMetadata, userId }
      )
      return { blockHash, blockNumber, userId }
    } catch (err) {
      console.error(getErrorMessage(err))
      throw err
    }
  }

  async function followUser(followeeUserId: ID) {
    try {
      return await audiusLibs.EntityManager.followUser(followeeUserId)
    } catch (err) {
      console.error(getErrorMessage(err))
      throw err
    }
  }

  async function unfollowUser(followeeUserId: ID) {
    try {
      return await audiusLibs.EntityManager.unfollowUser(followeeUserId)
    } catch (err) {
      console.error(getErrorMessage(err))
      throw err
    }
  }

  // TODO(C-2719)
  async function getFolloweeFollows(userId: ID, limit = 100, offset = 0) {
    let followers = []
    try {
      await waitForLibsInit()
      followers = await audiusLibs.User.getMutualFollowers(
        limit,
        offset,
        userId
      )

      if (followers.length) {
        return Promise.all(
          followers.map((follower: User) => getUserImages(follower))
        )
      }
    } catch (err) {
      console.error(getErrorMessage(err))
    }

    return followers
  }

  // TODO(C-2719)
  async function getPlaylists(
    userId: Nullable<ID>,
    playlistIds: Nullable<ID[]>,
    withUsers = true
  ): Promise<CollectionMetadata[]> {
    try {
      const playlists = await withEagerOption(
        {
          normal: (libs) => libs.Playlist.getPlaylists,
          eager: DiscoveryAPI.getPlaylists
        },
        100,
        0,
        playlistIds,
        userId,
        withUsers
      )
      return (playlists || []).map(getCollectionImages)
    } catch (err) {
      console.error(getErrorMessage(err))
      return []
    }
  }

  async function createPlaylist(
    playlistId: ID,
    metadata: Partial<Collection>,
    isAlbum = false,
    trackIds: ID[] = [],
    isPrivate = true
  ) {
    try {
      const web3 = await audiusLibs.web3Manager.getWeb3()
      const currentBlockNumber = await web3.eth.getBlockNumber()
      const currentBlock = await web3.eth.getBlock(currentBlockNumber)
      const playlistTracks = trackIds.map((trackId) => ({
        track: trackId,
        metadata_time: currentBlock.timestamp
      }))
      const response = await audiusLibs.EntityManager.createPlaylist({
        ...metadata,
        playlist_id: playlistId,
        playlist_contents: { track_ids: playlistTracks },
        is_album: isAlbum,
        is_private: isPrivate
      })
      const { blockHash, blockNumber, error } = response
      if (error) return { playlistId, error }
      return { blockHash, blockNumber, playlistId }
    } catch (err) {
      // This code path should never execute
      console.debug('Reached client createPlaylist catch block')
      console.error(getErrorMessage(err))
      return { playlistId: null, error: true }
    }
  }

  async function updatePlaylist(metadata: Collection) {
    try {
      const { blockHash, blockNumber } =
        await audiusLibs.EntityManager.updatePlaylist(metadata)

      return { blockHash, blockNumber }
    } catch (error) {
      console.error(getErrorMessage(error))
      return { error }
    }
  }

  async function orderPlaylist(playlist: any) {
    try {
      const { blockHash, blockNumber } =
        await audiusLibs.EntityManager.updatePlaylist(playlist)
      return { blockHash, blockNumber }
    } catch (error) {
      console.error(getErrorMessage(error))
      return { error }
    }
  }

  async function publishPlaylist(playlist: Collection) {
    try {
      playlist.is_private = false
      const { blockHash, blockNumber } =
        await audiusLibs.EntityManager.updatePlaylist({
          ...playlist,
          is_private: false
        })
      return { blockHash, blockNumber }
    } catch (error) {
      console.error(getErrorMessage(error))
      return { error }
    }
  }

  async function addPlaylistTrack(playlist: Collection) {
    try {
      const { blockHash, blockNumber } =
        await audiusLibs.EntityManager.updatePlaylist(playlist)
      return { blockHash, blockNumber }
    } catch (error) {
      console.error(getErrorMessage(error))
      return { error }
    }
  }

  async function deletePlaylistTrack(playlist: Collection) {
    try {
      const { blockHash, blockNumber } =
        await audiusLibs.EntityManager.updatePlaylist(playlist)
      return { blockHash, blockNumber }
    } catch (error) {
      console.error(getErrorMessage(error))
      return { error }
    }
  }

  // TODO(C-2719)
  async function validateTracksInPlaylist(playlistId: ID) {
    try {
      const { isValid, invalidTrackIds } =
        await audiusLibs.Playlist.validateTracksInPlaylist(playlistId)
      return { error: false, isValid, invalidTrackIds }
    } catch (error) {
      console.error(getErrorMessage(error))
      return { error }
    }
  }

  // NOTE: This is called to explicitly set a playlist track ids w/out running validation checks.
  // This should NOT be used to set the playlist order
  // It's added for the purpose of manually fixing broken playlists
  async function dangerouslySetPlaylistOrder(playlistId: ID, trackIds: ID[]) {
    try {
      await audiusLibs.contracts.PlaylistFactoryClient.orderPlaylistTracks(
        playlistId,
        trackIds
      )
      return { error: false }
    } catch (error) {
      console.error(getErrorMessage(error))
      return { error }
    }
  }

  async function deletePlaylist(playlistId: ID) {
    try {
      const txReceipt = await audiusLibs.EntityManager.deletePlaylist(
        playlistId
      )
      return {
        blockHash: txReceipt.blockHash,
        blockNumber: txReceipt.blockNumber
      }
    } catch (error) {
      console.error(getErrorMessage(error))
      return { error }
    }
  }

  // Favoriting a track
  async function saveTrack(
    trackId: ID,
    metadata?: { is_save_of_repost: boolean }
  ) {
    try {
      return await audiusLibs.EntityManager.saveTrack(
        trackId,
        JSON.stringify(metadata)
      )
    } catch (err) {
      console.error(getErrorMessage(err))
      throw err
    }
  }

  async function deleteTrack(trackId: ID) {
    try {
      const { txReceipt } = await audiusLibs.Track.deleteTrack(trackId, true)
      return {
        blockHash: txReceipt.blockHash,
        blockNumber: txReceipt.blockNumber
      }
    } catch (err) {
      console.error(getErrorMessage(err))
      throw err
    }
  }

  // Favorite a playlist
  async function saveCollection(
    playlistId: ID,
    metadata?: { is_save_of_repost: boolean }
  ) {
    try {
      return await audiusLibs.EntityManager.savePlaylist(
        playlistId,
        JSON.stringify(metadata)
      )
    } catch (err) {
      console.error(getErrorMessage(err))
      throw err
    }
  }

  // Unfavoriting a track
  async function unsaveTrack(trackId: ID) {
    try {
      return await audiusLibs.EntityManager.unsaveTrack(trackId)
    } catch (err) {
      console.error(getErrorMessage(err))
      throw err
    }
  }

  // Unfavorite a playlist
  async function unsaveCollection(playlistId: ID) {
    try {
      return await audiusLibs.EntityManager.unsavePlaylist(playlistId)
    } catch (err) {
      console.error(getErrorMessage(err))
      throw err
    }
  }

  async function signIn(
    email: string,
    password: string,
    visitorId?: string,
    otp?: string
  ) {
    await waitForLibsInit()
    return audiusLibs.Account.login(email, password, visitorId, otp)
  }

  async function signOut() {
    await waitForLibsInit()
    return audiusLibs.Account.logout()
  }

  /**
   * @param formFields {name, handle, profilePicture, coverPhoto, isVerified, location}
   * @param hasWallet the user already has a wallet but didn't complete sign up
   * @param referrer the user_id of the account that referred this one
   */
  async function signUp({
    email,
    password,
    formFields,
    hasWallet = false,
    referrer = null,
    feePayerOverride = null
  }: {
    email: string
    password: string
    formFields: {
      name?: string
      handle?: string
      isVerified?: boolean
      location?: string | null
      profilePicture: File | null
      coverPhoto: File | null
    }
    hasWallet: boolean
    referrer: Nullable<ID>
    feePayerOverride: Nullable<string>
  }) {
    await waitForLibsInit()
    const metadata = schemas.newUserMetadata()
    if (formFields.name) {
      metadata.name = formFields.name
    }
    if (formFields.handle) {
      metadata.handle = formFields.handle
    }
    if (formFields.isVerified) {
      metadata.is_verified = formFields.isVerified
    }
    if (formFields.location) {
      metadata.location = formFields.location
    }

    const hasEvents = referrer || nativeMobile
    if (hasEvents) {
      metadata.events = {}
    }
    if (referrer) {
      metadata.events.referrer = referrer
    }
    if (nativeMobile) {
      metadata.events.is_mobile_user = true
      setLocalStorageItem('is-mobile-user', 'true')
    }

    return await audiusLibs.Account.signUpV2(
      email,
      password,
      metadata,
      formFields.profilePicture,
      formFields.coverPhoto,
      hasWallet,
      getHostUrl(),
      (eventName: string, properties: Record<string, unknown>) =>
        recordAnalytics({ eventName, properties }),
      {
        Request: Name.CREATE_USER_BANK_REQUEST,
        Success: Name.CREATE_USER_BANK_SUCCESS,
        Failure: Name.CREATE_USER_BANK_FAILURE
      },
      feePayerOverride,
      true
    )
  }

  async function resetPassword(username: string, password: string) {
    const libs = await getAudiusLibsTyped()
    return libs.Account!.resetPassword({ username, password })
  }

  async function sendRecoveryEmail(handle: string) {
    await waitForLibsInit()
    const host = getHostUrl()
    return audiusLibs.Account.generateRecoveryLink({ handle, host })
  }

  async function emailInUse(email: string) {
    await waitForLibsInit()
    try {
      const { exists: emailExists } =
        await audiusLibs.Account.checkIfEmailRegistered(email)
      return emailExists as boolean
    } catch (error) {
      console.error(getErrorMessage(error))
      throw error
    }
  }

  async function twitterHandle(handle: string) {
    await waitForLibsInit()
    try {
      const user: TwitterUser = await audiusLibs.Account.lookupTwitterHandle(
        handle
      )
      return { success: true, user }
    } catch (error) {
      return { success: false, error }
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

  async function associateTwitterAccount(
    twitterId: string,
    userId: ID,
    handle: string,
    blockNumber: number
  ) {
    await waitForLibsInit()
    try {
      await audiusLibs.Account.associateTwitterUser(
        twitterId,
        userId,
        handle,
        blockNumber
      )
      return { success: true }
    } catch (error) {
      console.error(getErrorMessage(error))
      return { success: false, error }
    }
  }

  async function associateInstagramAccount(
    instagramId: string,
    userId: ID,
    handle: string,
    blockNumber: number
  ) {
    await waitForLibsInit()
    try {
      await audiusLibs.Account.associateInstagramUser(
        instagramId,
        userId,
        handle,
        blockNumber
      )
      return { success: true }
    } catch (error) {
      console.error(getErrorMessage(error))
      return { success: false, error }
    }
  }

  async function associateTikTokAccount(
    tikTokId: string,
    userId: ID,
    handle: string,
    blockNumber: number
  ) {
    await waitForLibsInit()
    try {
      await audiusLibs.Account.associateTikTokUser(
        tikTokId,
        userId,
        handle,
        blockNumber
      )
      return { success: true }
    } catch (error) {
      console.error(getErrorMessage(error))
      return { success: false, error }
    }
  }

  async function markAllNotificationAsViewed({ userId }: { userId: ID }) {
    await waitForLibsInit()

    let notificationsReadResponse
    try {
      const { data, signature } = await signData()
      // Passing `user_id` to support manager mode
      const response = await fetch(
        `${identityServiceUrl}/notifications/all?user_id=${userId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            [AuthHeaders.Message]: data,
            [AuthHeaders.Signature]: signature
          },
          body: JSON.stringify({ isViewed: true, clearBadges: !!nativeMobile })
        }
      )
      notificationsReadResponse = await response.json()
    } catch (e) {
      console.error(e)
    }
    try {
      await audiusLibs.Notifications.viewNotification({ userId })
    } catch (err) {
      console.error(err)
    }
    return notificationsReadResponse
  }

  async function clearNotificationBadges() {
    await waitForLibsInit()
    try {
      const { data, signature } = await signData()
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

  async function getEmailNotificationSettings() {
    await waitForLibsInit()

    try {
      const { data, signature } = await signData()
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
    emailFrequency,
    userId
  }: {
    emailFrequency: string
    userId: ID
  }) {
    await waitForLibsInit()

    try {
      const { data, signature } = await signData()
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

  async function updateNotificationSettings(
    settings: Partial<Record<BrowserNotificationSetting, boolean>>
  ) {
    await waitForLibsInit()

    try {
      const { data, signature } = await signData()
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

  async function updatePushNotificationSettings(
    settings: Partial<Record<PushNotificationSetting, boolean>>
  ) {
    await waitForLibsInit()

    try {
      const { data, signature } = await signData()
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

  async function signData() {
    await waitForLibsInit()
    const unixTs = Math.round(new Date().getTime() / 1000) // current unix timestamp (sec)
    const data = `Click sign to authenticate with identity service: ${unixTs}`
    const signature = await audiusLibs.Account.web3Manager.sign(
      Buffer.from(data, 'utf-8')
    )
    return { data, signature }
  }

  async function signDiscoveryNodeRequest(input?: any) {
    await waitForLibsInit()
    let data
    if (input) {
      data = input
    } else {
      const unixTs = Math.round(new Date().getTime() / 1000) // current unix timestamp (sec)
      data = `Click sign to authenticate with discovery node: ${unixTs}`
    }
    const signature = await audiusLibs.Account.web3Manager.sign(data)
    return { data, signature }
  }

  async function getBrowserPushNotificationSettings() {
    await waitForLibsInit()

    try {
      const { data, signature } = await signData()
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

  async function getBrowserPushSubscription(pushEndpoint: string) {
    await waitForLibsInit()

    try {
      const { data, signature } = await signData()
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

  async function getSafariBrowserPushEnabled(deviceToken: string) {
    await waitForLibsInit()

    try {
      const { data, signature } = await signData()
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
    enabled = true,
    subscription
  }: {
    enabled: boolean
    subscription: PushSubscription
  }) {
    await waitForLibsInit()
    const { data, signature } = await signData()
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
    subscription
  }: {
    subscription: PushSubscription
  }) {
    await waitForLibsInit()
    const { data, signature } = await signData()
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

  async function getPushNotificationSettings() {
    await waitForLibsInit()

    try {
      const { data, signature } = await signData()
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

  async function registerDeviceToken(deviceToken: string, deviceType: string) {
    await waitForLibsInit()

    try {
      const { data, signature } = await signData()
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

  async function deregisterDeviceToken(deviceToken: string) {
    await waitForLibsInit()

    try {
      const { data, signature } = await signData()
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

  async function subscribeToUser({
    subscribeToUserId,
    userId
  }: {
    subscribeToUserId: ID
    userId: ID
  }) {
    try {
      await waitForLibsInit()
      return await audiusLibs.User.addUserSubscribe(subscribeToUserId, userId)
    } catch (err) {
      console.error(getErrorMessage(err))
      throw err
    }
  }

  async function unsubscribeFromUser({
    subscribedToUserId,
    userId
  }: {
    subscribedToUserId: ID
    userId: ID
  }) {
    try {
      await waitForLibsInit()

      return await audiusLibs.User.deleteUserSubscribe(
        subscribedToUserId,
        userId
      )
    } catch (err) {
      console.error(getErrorMessage(err))
      throw err
    }
  }

  async function updateUserLocationTimezone() {
    await waitForLibsInit()

    try {
      const { data, signature } = await signData()
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

  async function sendWelcomeEmail({ name }: { name: string }) {
    await waitForLibsInit()

    try {
      const { data, signature } = await signData()
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
    hasSignedInNativeMobile
  }: {
    hasSignedInNativeMobile: boolean
  }) {
    await waitForLibsInit()

    try {
      const { data, signature } = await signData()
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

  /**
   * Sets the playlist as viewed to reset the playlist updates notifications timer
   * @param {playlistId} playlistId playlist id or folder id
   */
  async function updatePlaylistLastViewedAt({
    playlistId,
    userId
  }: {
    playlistId: ID
    userId: ID
  }) {
    await waitForLibsInit()

    try {
      return await audiusLibs.Notifications.viewPlaylist({ playlistId, userId })
    } catch (err) {
      console.error(getErrorMessage(err))
    }
  }

  async function updateHCaptchaScore({ token }: { token: string }) {
    await waitForLibsInit()
    try {
      const { data, signature } = await signData()
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

  async function getRandomFeePayer() {
    await waitForLibsInit()
    try {
      const { feePayer } =
        await audiusLibs.solanaWeb3Manager.getRandomFeePayer()
      audiusLibs.solanaWeb3Manager.feePayerKey = new PublicKey(feePayer)
      return { feePayer }
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
  async function getWAudioBalance(ethAddress?: string): Promise<BN | null> {
    await waitForLibsInit()

    try {
      const userBank = await audiusLibs.solanaWeb3Manager.deriveUserBank({
        ethAddress
      })
      const ownerWAudioBalance =
        await audiusLibs.solanaWeb3Manager.getWAudioBalance(userBank)
      if (isNullOrUndefined(ownerWAudioBalance)) {
        throw new Error('Failed to fetch account waudio balance')
      }
      return ownerWAudioBalance
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
  async function getAddressSolBalance(address: string): Promise<BNWei> {
    await waitForLibsInit()
    const solBalance = await audiusLibs.solanaWeb3Manager.getSolBalance(address)
    return solBalance
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

  async function getAssociatedTokenAccountInfo(address: string) {
    await waitForLibsInit()

    // Check if the user has a user bank acccount
    let tokenAccountInfo =
      await audiusLibs.solanaWeb3Manager.getTokenAccountInfo(address)
    if (!tokenAccountInfo) {
      console.info('Provided recipient solana address was not a token account')
      // If not, check to see if it already has an associated token account.
      const associatedTokenAccount =
        await audiusLibs.solanaWeb3Manager.findAssociatedTokenAddress(address)
      tokenAccountInfo = await audiusLibs.solanaWeb3Manager.getTokenAccountInfo(
        associatedTokenAccount.toString()
      )
    }
    return tokenAccountInfo
  }

  /**
   * Make a request to send solana wrapped audio
   */
  async function sendWAudioTokens(address: string, amount: BNWei) {
    await waitForLibsInit()

    // Check when sending waudio if the user has a user bank acccount
    const tokenAccountInfo = await getAssociatedTokenAccountInfo(address)

    // If it's not a valid token account, we need to make one first
    if (!tokenAccountInfo) {
      // We do not want to relay gas fees for this token account creation,
      // so we ask the user to create one with phantom, showing an error
      // if phantom is not found.
      if (!window.phantom) {
        return {
          error:
            'Recipient has no $AUDIO token account. Please install Phantom-Wallet to create one.'
        }
      }
      if (!window.solana.isConnected) {
        await window.solana.connect()
      }

      const phantomWallet = window.solana.publicKey?.toString()
      const tx = await getCreateAssociatedTokenAccountTransaction({
        feePayerKey: SolanaUtils.newPublicKeyNullable(phantomWallet),
        solanaWalletKey: SolanaUtils.newPublicKeyNullable(address),
        mintKey: audiusLibs.solanaWeb3Manager.mints.audio,
        solanaTokenProgramKey: audiusLibs.solanaWeb3Manager.solanaTokenKey,
        connection: audiusLibs.solanaWeb3Manager.getConnection()
      })
      const { signature } = await window.solana.signAndSendTransaction(tx)
      await audiusLibs.solanaWeb3Manager
        .getConnection()
        .confirmTransaction(signature)
    }
    return audiusLibs.solanaWeb3Manager.transferWAudio(address, amount)
  }

  async function getSignature(data: any) {
    await waitForLibsInit()
    return audiusLibs.web3Manager.sign(data)
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
   * @returns {Promise<BN | null>} Returns the balance, or null if error
   */
  async function getAddressWAudioBalance(address: string) {
    await waitForLibsInit()
    const waudioBalance = await audiusLibs.solanaWeb3Manager.getWAudioBalance(
      address
    )
    if (isNullOrUndefined(waudioBalance)) {
      console.warn(`Failed to get waudio balance for address: ${address}`)
      reportError({
        error: new Error('Failed to get wAudio balance for address'),
        additionalInfo: { address }
      })
      return null
    }
    return new BN(waudioBalance.toString())
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

  return {
    addDiscoveryProviderSelectionListener,
    addPlaylistTrack,
    audiusLibs: audiusLibs as AudiusLibsType,
    associateInstagramAccount,
    associateTwitterAccount,
    associateTikTokAccount,
    clearNotificationBadges,
    createPlaylist,
    currentDiscoveryProvider,
    dangerouslySetPlaylistOrder,
    deletePlaylist,
    deletePlaylistTrack,
    deleteTrack,
    deregisterDeviceToken,
    didSelectDiscoveryProviderListeners,
    disableBrowserNotifications,
    emailInUse,
    fetchCID,
    fetchImageCID,
    fetchUserAssociatedEthWallets,
    fetchUserAssociatedSolWallets,
    fetchUserAssociatedWallets,
    followUser,
    getAddressTotalStakedBalance,
    getAddressWAudioBalance,
    getAddressSolBalance,
    getAssociatedTokenAccountInfo,
    getAudiusLibs,
    getAudiusLibsTyped,
    getBalance,
    getBrowserPushNotificationSettings,
    getBrowserPushSubscription,
    getCollectionImages,
    getCreators,
    getEmailNotificationSettings,
    getFolloweeFollows,
    getImageUrl,
    getPlaylists,
    getPushNotificationSettings,
    getRandomFeePayer,
    getSafariBrowserPushEnabled,
    getSignature,
    getTrackImages,
    getUserEmail,
    getUserImages,
    getUserListenCountsMonthly,
    getWAudioBalance,
    getWeb3,
    identityServiceUrl,
    markAllNotificationAsViewed,
    orderPlaylist,
    publishPlaylist,
    recordTrackListen,
    registerDeviceToken,
    repostCollection,
    repostTrack,
    resetPassword,
    sanityChecks,
    saveCollection,
    saveTrack,
    searchTags,
    sendRecoveryEmail,
    sendTokens,
    sendWAudioTokens,
    sendWelcomeEmail,
    setCreatorNodeEndpoint,
    setup,
    setUserHandleForRelay,
    signData,
    signDiscoveryNodeRequest,
    signIn,
    signOut,
    signUp,
    transferAudioToWAudio,
    twitterHandle,
    instagramHandle,
    tiktokHandle,
    undoRepostCollection,
    undoRepostTrack,
    unfollowUser,
    unsaveCollection,
    unsaveTrack,
    updateBrowserNotifications,
    updateCreator,
    updateEmailNotificationSettings,
    updateHCaptchaScore,
    updateNotificationSettings,
    updatePlaylist,
    updatePlaylistLastViewedAt,
    updatePushNotificationSettings,
    updateTrack,
    updateUserEvent,
    updateUserLocationTimezone,
    subscribeToUser,
    unsubscribeFromUser,
    uploadImage,
    userNodeUrl,
    validateTracksInPlaylist,
    waitForLibsInit,
    waitForWeb3
  }
}

/**
 * Finds the associated token address given a solana wallet public key
 * @param solanaWalletKey Public Key for a given solana account (a wallet)
 * @param mintKey
 * @param solanaTokenProgramKey
 * @returns token account public key
 */
async function findAssociatedTokenAddress({
  solanaWalletKey,
  mintKey,
  solanaTokenProgramKey
}: {
  solanaWalletKey: PublicKey
  mintKey: PublicKey
  solanaTokenProgramKey: PublicKey
}) {
  const addresses = await PublicKey.findProgramAddress(
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
  mintKey,
  solanaTokenProgramKey,
  connection
}: {
  feePayerKey: PublicKey
  solanaWalletKey: PublicKey
  mintKey: PublicKey
  solanaTokenProgramKey: PublicKey
  connection: typeof AudiusLibs.IdentityService
}) {
  const associatedTokenAddress = await findAssociatedTokenAddress({
    solanaWalletKey,
    mintKey,
    solanaTokenProgramKey
  })
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

  const { blockhash } = await connection.getRecentBlockhash('confirmed')
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

export type AudiusBackend = ReturnType<typeof audiusBackend>
