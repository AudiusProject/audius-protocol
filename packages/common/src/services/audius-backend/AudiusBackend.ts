import { IdentityAPI, DiscoveryAPI } from '@audius/sdk/dist/core'
import type { HedgehogConfig } from '@audius/sdk/dist/services/hedgehog'
import type { LocalStorage } from '@audius/sdk/dist/utils/localStorage'
import type { Span, SpanOptions, Tracer } from '@opentelemetry/api'
import { SemanticAttributes } from '@opentelemetry/semantic-conventions'
import { ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token'
import {
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
  TransactionInstruction
} from '@solana/web3.js'
import BN from 'bn.js'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

import placeholderCoverArt from '../../assets/img/imageBlank2x.png'
import imageCoverPhotoBlank from '../../assets/img/imageCoverPhotoBlank.jpg'
import placeholderProfilePicture from '../../assets/img/imageProfilePicEmpty2X.png'
import {
  BNWei,
  ChallengeRewardID,
  CID,
  Collection,
  CollectionMetadata,
  CoverArtSizes,
  CoverPhotoSizes,
  DefaultSizes,
  FailureReason,
  FeedFilter,
  ID,
  Name,
  PlaylistTrackId,
  ProfilePictureSizes,
  Track,
  TrackMetadata,
  User,
  UserMetadata,
  UserTrack
} from '../../models'
import { AnalyticsEvent } from '../../models/Analytics'
import { ReportToSentryArgs } from '../../models/ErrorReporting'
import * as schemas from '../../schemas'
import { ClientRewardsReporter } from '../../services/audius-backend/Rewards'
import {
  FeatureFlags,
  BooleanKeys,
  IntKeys,
  StringKeys,
  RemoteConfigInstance
} from '../../services/remote-config'
import {
  BrowserNotificationSetting,
  PushNotificationSetting
} from '../../store'
import { CIDCache } from '../../store/cache/CIDCache'
import {
  Nullable,
  getErrorMessage,
  uuid,
  Maybe,
  encodeHashId,
  Timer
} from '../../utils'

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
  signAndSendTransaction: (transaction: Transaction) => Promise<Transaction>
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

dayjs.extend(utc)
dayjs.extend(timezone)

const SEARCH_MAX_SAVED_RESULTS = 10
const SEARCH_MAX_TOTAL_RESULTS = 50
const IMAGE_CACHE_MAX_SIZE = 200

export const AuthHeaders = Object.freeze({
  Message: 'Encoded-Data-Message',
  Signature: 'Encoded-Data-Signature'
})

type SnakeToCamel<S extends string> = S extends `${infer T}_${infer U}`
  ? `${T}${Capitalize<SnakeToCamel<U>>}`
  : S

type SnakeKeysToCamel<T> = {
  [K in keyof T as SnakeToCamel<Extract<K, string>>]: T[K]
}

type DiscoveryEndpoint = (...args: any) => { queryParams: Record<string, any> }
type DiscoveryAPIParams<Endpoint extends DiscoveryEndpoint> = SnakeKeysToCamel<
  ReturnType<Endpoint>['queryParams']
>

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

/**
 * Higher-order function that adds opentelemetry tracing to a function.
 * This wrapper works for both sync and async functions
 *
 * @param {string?} param.name optional name to give to the span, defaults to the function name
 * @param {Object?} param.context optional object context to get wrapped, useful when wrapping non-static methods to classes
 * @param {TFunction} param.fn the generic function to instrument
 * @param {SpanOptions?} param.options objects to pass into the span
 * @returns the instrumented function
 * @throws rethrows any errors from the original fn
 *
 * Usage of this would look like
 * ```
 * const someFunction = instrumentTracing({ fn: _someFunction })
 * const result = someFunction(args))
 * // or
 * const result = await someFunction(args)
 * ```
 */
const instrumentTracing = <TFunction extends (...args: any[]) => any>({
  fn,
  tracer,
  name,
  context,
  options
}: {
  fn: TFunction
  tracer: Tracer
  name?: string
  context?: Object
  options?: SpanOptions
}) => {
  const objectContext = context || this

  // build a wrapper around `fn` that accepts the same parameters and returns the same return type
  const wrapper = function (
    ...args: Parameters<TFunction>
  ): ReturnType<TFunction> {
    const spanName = name || fn.name
    const spanOptions = options || {}
    return tracer.startActiveSpan(spanName, spanOptions, (span: Span) => {
      try {
        span.setAttribute(SemanticAttributes.CODE_FUNCTION, fn.name)

        // TODO add skip parameter to instrument testing function to NOT log certain args
        // tracing.setSpanAttribute('args', JSON.stringify(args))
        const result = fn.apply(objectContext, args)

        // if `fn` is async, await the result
        if (result && result.then) {
          /**
           * by handling promise like this, the caller to this wrapper
           * can still use normal async/await syntax to `await` the result
           * of this wrapper
           * i.e. `const output = await instrumentTracing({ fn: _someFunction })(args)`
           *
           * based on this package: https://github.com/klny/function-wrapper/blob/master/src/wrapper.js#L25
           */
          return result.then((val: any) => {
            span.end()
            return val
          })
        }

        span.end()

        // re-return result from synchronous function
        return result
      } catch (e: any) {
        span.recordException(e)
        span.end()

        // rethrow any errors
        throw e
      }
    })
  }
  // copy function name
  Object.defineProperty(wrapper, 'name', { value: fn.name })
  return wrapper
}

type TransactionReceipt = { blockHash: string; blockNumber: number }

let preloadImageTimer: Timer
const avoidGC: HTMLImageElement[] = []

type DiscoveryProviderListener = (endpoint: Nullable<string>) => void

type AudiusBackendSolanaConfig = Partial<{
  anchorAdminAccount: string
  anchorProgramId: string
  claimableTokenPda: string
  claimableTokenProgramAddress: string
  rewardsManagerProgramId: string
  rewardsManagerProgramPda: string
  rewardsManagerTokenPda: string
  solanaClusterEndpoint: string
  solanaFeePayerAddress: string
  solanaTokenAddress: string
  waudioMintAddress: string
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
  disableImagePreload?: boolean
  ethOwnerWallet: Maybe<string>
  ethProviderUrls: Maybe<string[]>
  ethRegistryAddress: Maybe<string>
  ethTokenAddress: Maybe<string>
  getFeatureEnabled: (
    flag: FeatureFlags
  ) => Promise<boolean | null> | null | boolean
  getHostUrl: () => Nullable<string>
  getLibs: () => Promise<any>
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
  isElectron: Maybe<boolean>
  isMobile: Maybe<boolean>
  legacyUserNodeUrl: Maybe<string>
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
  tracer: Tracer
}

export const audiusBackend = ({
  claimDistributionContractAddress,
  disableImagePreload,
  ethOwnerWallet,
  ethProviderUrls,
  ethRegistryAddress,
  ethTokenAddress,
  getFeatureEnabled,
  getHostUrl,
  getLibs,
  getWeb3Config,
  hedgehogConfig,
  identityServiceUrl,
  isElectron,
  isMobile,
  legacyUserNodeUrl,
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
    anchorAdminAccount,
    anchorProgramId,
    claimableTokenPda,
    claimableTokenProgramAddress,
    rewardsManagerProgramId,
    rewardsManagerProgramPda,
    rewardsManagerTokenPda,
    solanaClusterEndpoint,
    solanaFeePayerAddress,
    solanaTokenAddress,
    waudioMintAddress,
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
  },
  tracer
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

  function getCreatorNodeIPFSGateways(endpoint: Nullable<string>) {
    if (endpoint) {
      return endpoint
        .split(',')
        .filter(Boolean)
        .map((endpoint) => `${endpoint}/ipfs/`)
    }
    const gateways = [`${userNodeUrl}/ipfs/`]
    if (legacyUserNodeUrl) {
      gateways.push(`${legacyUserNodeUrl}/ipfs/`)
    }
    return gateways
  }

  async function preloadImage(url: string) {
    if (!preloadImageTimer) {
      const batchSize =
        getRemoteVar(IntKeys.IMAGE_QUICK_FETCH_PERFORMANCE_BATCH_SIZE) ??
        undefined

      preloadImageTimer = new Timer(
        {
          name: 'image_preload',
          batch: true,
          batchSize
        },
        ({ name, duration }) => {
          console.info(`Recorded event ${name} with duration ${duration}`)
          recordAnalytics({
            eventName: Name.PERFORMANCE,
            properties: {
              metric: name,
              value: duration
            }
          })
        }
      )
    }

    return new Promise<string | false>((resolve) => {
      const start = preloadImageTimer.start()

      const timeoutMs =
        getRemoteVar(IntKeys.IMAGE_QUICK_FETCH_TIMEOUT_MS) ?? undefined
      const timeout = setTimeout(() => {
        preloadImageTimer.end(start)
        resolve(false)
      }, timeoutMs)

      // Avoid garbage collection by keeping a few images in an in-mem array
      const image = new Image()
      avoidGC.push(image)
      if (avoidGC.length > IMAGE_CACHE_MAX_SIZE) avoidGC.shift()

      image.onload = () => {
        preloadImageTimer.end(start)
        clearTimeout(timeout)
        resolve(url)
      }

      image.onerror = () => {
        preloadImageTimer.end(start)
        clearTimeout(timeout)
        resolve(false)
      }
      image.src = url
    })
  }

  async function fetchCID(
    cid: CID,
    creatorNodeGateways = [] as string[],
    cache = true,
    asUrl = true,
    trackId: Nullable<ID> = null
  ) {
    await waitForLibsInit()
    try {
      const res = await audiusLibs.File.fetchCID(
        cid,
        creatorNodeGateways,
        () => {},
        // If requesting a url (we mean a blob url for the file),
        // otherwise, default to JSON
        asUrl ? 'blob' : 'json',
        trackId
      )
      if (asUrl) {
        const url = URL.createObjectURL(res.data)
        if (cache) CIDCache.add(cid, url)
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
    creatorNodeGateways: string[] = [],
    cache = true
  ) {
    if (CIDCache.has(cid)) {
      return CIDCache.get(cid)
    }

    creatorNodeGateways.push(`${userNodeUrl}/ipfs`)
    const primary = creatorNodeGateways[0]
    const firstImageUrl = `${primary}${cid}`

    if (disableImagePreload) {
      return firstImageUrl
    }

    if (primary) {
      // Attempt to fetch/load the image using the first creator node gateway
      const preloadedImageUrl = await preloadImage(firstImageUrl)

      // If the image is loaded, add to cache and return
      if (preloadedImageUrl && cache) CIDCache.add(cid, preloadedImageUrl)
      if (preloadedImageUrl) return preloadedImageUrl
    }

    await waitForLibsInit()
    // Else, race fetching of the image from all gateways & return the image url blob
    try {
      const image = await audiusLibs.File.fetchCID(
        cid,
        creatorNodeGateways,
        () => {}
      )

      const url = nativeMobile
        ? image.config.url
        : URL.createObjectURL(image.data)

      if (cache) CIDCache.add(cid, url)

      return url
    } catch (e) {
      console.error(e)
      return ''
    }
  }

  async function getImageUrl(cid: CID, size: string, gateways: string[]) {
    if (!cid) return ''
    try {
      return size
        ? fetchImageCID(`${cid}/${size}.jpg`, gateways)
        : fetchImageCID(cid, gateways)
    } catch (e) {
      console.error(e)
      return ''
    }
  }

  function getTrackImages(track: TrackMetadata) {
    const coverArtSizes: CoverArtSizes = {}
    if (!track.cover_art_sizes && !track.cover_art) {
      coverArtSizes[DefaultSizes.OVERRIDE] = placeholderCoverArt as string
    }

    return {
      ...track,
      // TODO: This method should be renamed as it does more than images.
      duration: track.track_segments.reduce(
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
      coverArtSizes[DefaultSizes.OVERRIDE] = placeholderCoverArt as string
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

  function creatorNodeSelectionCallback(
    primary: string,
    secondaries: string[],
    reason: string
  ) {
    recordAnalytics({
      eventName: Name.CREATOR_NODE_SELECTION,
      properties: {
        endpoint: primary,
        selectedAs: 'primary',
        reason
      }
    })
    secondaries.forEach((secondary) => {
      recordAnalytics({
        eventName: Name.CREATOR_NODE_SELECTION,
        properties: {
          endpoint: secondary,
          selectedAs: 'secondary',
          reason
        }
      })
    })
  }

  async function sanityChecks(audiusLibs: any) {
    try {
      const sanityCheckOptions = {
        skipRollover: getRemoteVar(BooleanKeys.SKIP_ROLLOVER_NODES_SANITY_CHECK)
      }
      const sanityChecks = new SanityChecks(audiusLibs, sanityCheckOptions)
      await sanityChecks.run()
    } catch (e) {
      console.error(`Sanity checks failed: ${e}`)
    }
  }

  async function setup() {
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
    const { solanaAudiusDataConfig } = getSolanaAudiusDataConfig()
    const { wormholeConfig } = getWormholeConfig()

    const contentNodeBlockList = getBlockList(
      StringKeys.CONTENT_NODE_BLOCK_LIST
    )
    const discoveryNodeBlockList = getBlockList(
      StringKeys.DISCOVERY_NODE_BLOCK_LIST
    )

    try {
      audiusLibs = new AudiusLibs({
        localStorage,
        web3Config,
        ethWeb3Config,
        solanaWeb3Config,
        solanaAudiusDataConfig,
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
            IntKeys.DISCOVERY_NODE_MAX_SLOT_DIFF_PLAYS
          ),
          unhealthyBlockDiff: getRemoteVar(
            IntKeys.DISCOVERY_NODE_MAX_BLOCK_DIFF
          )
        },
        identityServiceConfig:
          AudiusLibs.configIdentityService(identityServiceUrl),
        creatorNodeConfig: AudiusLibs.configCreatorNode(
          userNodeUrl,
          /* lazyConnect */ true,
          /* passList */ null,
          contentNodeBlockList,
          monitoringCallbacks.contentNode,
          /* writeQuorumEnabled */ await getFeatureEnabled(
            FeatureFlags.WRITE_QUORUM_ENABLED
          )
        ),
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
      await audiusLibs.init()
      onLibsInit(audiusLibs)

      sanityChecks(audiusLibs)
    } catch (err) {
      console.log(err)
      libsError = getErrorMessage(err)
    }

    return { libsError, web3Error: false }
  }

  function getEthWeb3Config() {
    const providerUrls =
      getRemoteVar(StringKeys.ETH_PROVIDER_URLS) || ethProviderUrls
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
      !rewardsManagerTokenPda
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
        solanaTokenAddress,
        claimableTokenPDA: claimableTokenPda,
        feePayerAddress: solanaFeePayerAddress,
        claimableTokenProgramAddress,
        rewardsManagerProgramId,
        rewardsManagerProgramPDA: rewardsManagerProgramPda,
        rewardsManagerTokenPDA: rewardsManagerTokenPda,
        useRelay: true
      })
    }
  }

  function getSolanaAudiusDataConfig() {
    if (!anchorProgramId || !anchorAdminAccount) {
      console.warn('Missing solana audius data config')
      return {
        error: true
      }
    }

    return {
      error: false,
      solanaAudiusDataConfig: AudiusLibs.configSolanaAudiusData({
        programId: anchorProgramId,
        adminAccount: anchorAdminAccount
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
      console.warn('Missing wormhole configs')
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

  async function isCreatorNodeSyncing(endpoint: string) {
    try {
      const { isBehind, isConfigured } =
        await audiusLibs.creatorNode.getSyncStatus(endpoint)
      return isBehind && isConfigured
    } catch (e) {
      return true
    }
  }

  async function listCreatorNodes() {
    return audiusLibs.ServiceProvider.listCreatorNodes()
  }

  async function autoSelectCreatorNodes() {
    return audiusLibs.ServiceProvider.autoSelectCreatorNodes({})
  }

  async function getSelectableCreatorNodes() {
    const contentNodeBlockList = getBlockList(
      StringKeys.CONTENT_NODE_BLOCK_LIST
    )
    return audiusLibs.ServiceProvider.getSelectableCreatorNodes(
      /* whitelist */ null,
      /* blacklist */ contentNodeBlockList
    )
  }

  async function getAccount(fromSource = false) {
    await waitForLibsInit()
    try {
      let account
      if (fromSource) {
        const wallet = audiusLibs.Account.getCurrentUser().wallet
        account = await audiusLibs.discoveryProvider.getUserAccount(wallet)
        audiusLibs.userStateManager.setCurrentUser(account)
      } else {
        account = audiusLibs.Account.getCurrentUser()
        if (!account) return null
      }
      try {
        const body = await getCreatorSocialHandle(account.handle)
        account.twitter_handle = body.twitterHandle || null
        account.instagram_handle = body.instagramHandle || null
        account.tiktok_handle = body.tikTokHandle || null
        account.website = body.website || null
        account.donation = body.donation || null
        account._artist_pick = body.pinnedTrackId || null
        account.twitterVerified = body.twitterVerified || false
        account.instagramVerified = body.instagramVerified || false
      } catch (e) {
        console.error(e)
      }
      try {
        const userBank = await audiusLibs.solanaWeb3Manager.deriveUserBank()
        account.userBank = userBank.toString()
        return getUserImages(account)
      } catch (e) {
        // Failed to fetch solana user bank account for user
        // in any case
        console.error(e)
        return getUserImages(account)
      }
    } catch (e) {
      console.error(e)
      // No account
      return null
    }
  }

  async function getAllTracks({
    offset,
    limit,
    idsArray,
    withUsers = true,
    filterDeletes = false
  }: {
    offset: number
    limit: number
    idsArray: ID[]
    withUsers?: boolean
    filterDeletes?: boolean
  }) {
    try {
      const tracks = await withEagerOption(
        {
          normal: (libs) => libs.Track.getTracks,
          eager: DiscoveryAPI.getTracks
        },
        limit,
        offset,
        idsArray,
        null, // targetUserId
        null, // sort
        null, // minBlockNumber
        filterDeletes, // filterDeleted
        withUsers // withUsers
      )
      return tracks || []
    } catch (e) {
      console.error(e)
      return []
    }
  }

  /**
   * @typedef {Object} getTracksIdentifier
   * @property {string} handle
   * @property {number} id
   * @property {string} url_title
   */

  /**
   * gets all tracks matching identifiers, including unlisted.
   *
   * @param {getTracksIdentifier[]} identifiers
   * @returns {(Array)} track
   */
  async function getTracksIncludingUnlisted(
    identifiers: { id: ID }[],
    withUsers = true
  ) {
    try {
      const tracks = await withEagerOption(
        {
          normal: (libs) => libs.Track.getTracksIncludingUnlisted,
          eager: DiscoveryAPI.getTracksIncludingUnlisted
        },
        identifiers,
        withUsers
      )

      return tracks
    } catch (e) {
      console.error(e)
      return []
    }
  }

  async function getArtistTracks({
    offset,
    limit,
    userId,
    sort = null,
    filterDeleted = null,
    withUsers = true
  }: Omit<
    DiscoveryAPIParams<typeof DiscoveryAPI.getTracks>,
    'sort' | 'filterDeleted'
  > & {
    sort: Nullable<boolean>
    filterDeleted: Nullable<boolean>
  }) {
    try {
      const tracks = await withEagerOption(
        {
          normal: (libs) => libs.Track.getTracks,
          eager: DiscoveryAPI.getTracks
        },
        limit,
        offset,
        null,
        userId,
        sort,
        null,
        filterDeleted,
        withUsers
      )
      return tracks || []
    } catch (e) {
      console.error(e)
      return []
    }
  }

  async function getSocialFeed({
    filter,
    offset,
    limit,
    withUsers = true,
    tracksOnly = false
  }: DiscoveryAPIParams<typeof DiscoveryAPI.getSocialFeed>) {
    const filterMap = {
      [FeedFilter.ALL]: 'all',
      [FeedFilter.ORIGINAL]: 'original',
      [FeedFilter.REPOST]: 'repost'
    }

    let feedItems: Array<Collection | UserTrack> = []
    try {
      feedItems = await withEagerOption(
        {
          normal: (libs) => libs.User.getSocialFeed,
          eager: DiscoveryAPI.getSocialFeed,
          requiresUser: true
        },
        filterMap[filter as FeedFilter],
        limit,
        offset,
        withUsers,
        tracksOnly
      )
      // It's possible all the requests timed out,
      // we need to not return a null object here.
      if (!feedItems) return []
    } catch (err) {
      console.error(err)
    }
    return feedItems.map((item) => {
      if ('playlist_id' in item) {
        return getCollectionImages(item)
      }
      return item
    })
  }

  async function getUserFeed({
    offset,
    limit,
    userId,
    withUsers = true
  }: DiscoveryAPIParams<typeof DiscoveryAPI.getUserRepostFeed> & {
    userId: string
  }) {
    try {
      const tracks = await withEagerOption(
        {
          normal: (libs) => libs.User.getUserRepostFeed,
          eager: DiscoveryAPI.getUserRepostFeed
        },
        userId,
        limit,
        offset,
        withUsers
      )
      return tracks
    } catch (e) {
      console.error(e)
      return []
    }
  }

  async function searchTags({
    query,
    userTagCount,
    kind,
    offset,
    limit
  }: DiscoveryAPIParams<typeof DiscoveryAPI.searchTags>) {
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
        offset
      )

      const {
        tracks = [],
        saved_tracks: savedTracks = [],
        followed_users: followedUsers = [],
        users = []
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
        users: combinedUsers
      }
    } catch (e) {
      console.error(e)
      return {
        tracks: [],
        users: []
      }
    }
  }

  // trackIds, start, end, period
  async function getTrackListens(
    ...args: Parameters<typeof IdentityAPI.getTrackListens>
  ) {
    const [period, trackIds, start, end] = args
    if (trackIds?.length === 0) return []
    try {
      return withEagerOption(
        {
          normal: (libs) => libs.Track.getTrackListens,
          eager: IdentityAPI.getTrackListens,
          endpoint: identityServiceUrl
        },
        period,
        trackIds,
        start,
        end,
        trackIds?.length
      )
    } catch (err) {
      console.error(getErrorMessage(err))
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

  async function repostTrack(trackId: ID) {
    try {
      return audiusLibs.Track.addTrackRepost(trackId)
    } catch (err) {
      console.error(getErrorMessage(err))
      throw err
    }
  }

  async function undoRepostTrack(trackId: ID) {
    try {
      return audiusLibs.Track.deleteTrackRepost(trackId)
    } catch (err) {
      console.error(getErrorMessage(err))
      throw err
    }
  }

  async function repostCollection(playlistId: ID) {
    try {
      return audiusLibs.Playlist.addPlaylistRepost(playlistId)
    } catch (err) {
      console.error(getErrorMessage(err))
      throw err
    }
  }

  async function undoRepostCollection(playlistId: ID) {
    try {
      return audiusLibs.Playlist.deletePlaylistRepost(playlistId)
    } catch (err) {
      console.error(getErrorMessage(err))
      throw err
    }
  }

  /**
   * Upgrades a user to a creator
   * @param {string} newCreatorNodeEndpoint will follow the structure 'cn1,cn2,cn3'
   */
  async function upgradeToCreator(newCreatorNodeEndpoint: string) {
    return audiusLibs.User.upgradeToCreator(userNodeUrl, newCreatorNodeEndpoint)
  }

  // Uploads a single track
  // Returns { trackId, error, phase }
  async function uploadTrack(
    trackFile: File,
    coverArtFile: File,
    metadata: TrackMetadata,
    onProgress: (loaded: number, total: number) => void
  ) {
    return await audiusLibs.Track.uploadTrack(
      trackFile,
      coverArtFile,
      metadata,
      onProgress
    )
  }

  // Used to upload multiple tracks as part of an album/playlist
  // Returns { metadataMultihash, metadataFileUUID, transcodedTrackCID, transcodedTrackUUID }
  async function uploadTrackToCreatorNode(
    trackFile: File,
    coverArtFile: File,
    metadata: TrackMetadata,
    onProgress: (loaded: number, total: number) => void
  ) {
    return audiusLibs.Track.uploadTrackContentToCreatorNode(
      trackFile,
      coverArtFile,
      metadata,
      onProgress
    )
  }

  async function getUserEmail() {
    await waitForLibsInit()
    const { email } = await audiusLibs.Account.getUserEmail()
    return email
  }

  /**
   * Takes an array of [{metadataMultihash, metadataFileUUID}, {}, ]
   * Adds tracks to chain for this user
   * Associates tracks with user on creatorNode
   */
  async function registerUploadedTracks(
    uploadedTracks: { metadataMultihash: string; metadataFileUUID: string }[]
  ) {
    return audiusLibs.Track.addTracksToChainAndCnode(uploadedTracks)
  }

  async function uploadImage(file: File) {
    return audiusLibs.File.uploadImage(file)
  }

  async function updateTrack(
    _trackId: ID,
    metadata: TrackMetadata & { artwork: { file: File } }
  ) {
    const cleanedMetadata = schemas.newTrackMetadata(metadata, true)

    if (metadata.artwork) {
      const resp = await audiusLibs.File.uploadImage(metadata.artwork.file)
      cleanedMetadata.cover_art_sizes = resp.dirCID
    }
    return await audiusLibs.Track.updateTrack(cleanedMetadata)
  }

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

  async function getCreatorSocialHandle(handle: string) {
    try {
      const res = await fetch(
        `${identityServiceUrl}/social_handles?handle=${handle}`
      ).then((res) => res.json())
      return res
    } catch (e) {
      console.error(e)
      return {}
    }
  }

  /**
   * Retrieves the user's eth associated wallets from IPFS using the user's metadata CID and creator node endpoints
   * @param user The user metadata which contains the CID for the metadata multihash
   * @returns Object The associated wallets mapping of address to nested signature
   */
  async function fetchUserAssociatedEthWallets(user: User) {
    const gateways = getCreatorNodeIPFSGateways(user.creator_node_endpoint)
    const cid = user?.metadata_multihash ?? null
    if (cid) {
      const metadata = await fetchCID(
        cid,
        gateways,
        /* cache */ false,
        /* asUrl */ false
      )
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
  async function fetchUserAssociatedSolWallets(user: User) {
    const gateways = getCreatorNodeIPFSGateways(user.creator_node_endpoint)
    const cid = user?.metadata_multihash ?? null
    if (cid) {
      const metadata = await fetchCID(
        cid,
        gateways,
        /* cache */ false,
        /* asUrl */ false
      )
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
  async function fetchUserAssociatedWallets(user: User) {
    const gateways = getCreatorNodeIPFSGateways(user.creator_node_endpoint)
    const cid = user?.metadata_multihash ?? null
    if (cid) {
      const metadata = await fetchCID(
        cid,
        gateways,
        /* cache */ false,
        /* asUrl */ false
      )
      return {
        associated_sol_wallets: metadata?.associated_sol_wallets ?? null,
        associated_wallets: metadata?.associated_wallets ?? null
      }
    }
    return null
  }

  async function updateCreator(metadata: User, _id: ID) {
    let newMetadata = { ...metadata }
    const associatedWallets = await fetchUserAssociatedWallets(metadata)
    newMetadata.associated_wallets =
      newMetadata.associated_wallets || associatedWallets?.associated_wallets
    newMetadata.associated_sol_wallets =
      newMetadata.associated_sol_wallets ||
      associatedWallets?.associated_sol_wallets

    try {
      if (newMetadata.updatedProfilePicture) {
        const resp = await audiusLibs.File.uploadImage(
          newMetadata.updatedProfilePicture.file
        )
        newMetadata.profile_picture_sizes = resp.dirCID
      }

      if (newMetadata.updatedCoverPhoto) {
        const resp = await audiusLibs.File.uploadImage(
          newMetadata.updatedCoverPhoto.file,
          false
        )
        newMetadata.cover_photo_sizes = resp.dirCID
      }

      if (
        typeof newMetadata.twitter_handle === 'string' ||
        typeof newMetadata.instagram_handle === 'string' ||
        typeof newMetadata.tiktok_handle === 'string' ||
        typeof newMetadata.website === 'string' ||
        typeof newMetadata.donation === 'string'
      ) {
        const { data, signature } = await signData()
        await fetch(`${identityServiceUrl}/social_handles`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            [AuthHeaders.Message]: data,
            [AuthHeaders.Signature]: signature
          },
          body: JSON.stringify({
            twitterHandle: newMetadata.twitter_handle,
            instagramHandle: newMetadata.instagram_handle,
            tikTokHandle: newMetadata.tiktok_handle,
            website: newMetadata.website,
            donation: newMetadata.donation
          })
        })
      }

      newMetadata = schemas.newUserMetadata(newMetadata, true)

      const { blockHash, blockNumber, userId } =
        await audiusLibs.User.updateCreator(newMetadata.user_id, newMetadata)
      return { blockHash, blockNumber, userId }
    } catch (err) {
      console.error(getErrorMessage(err))
      return false
    }
  }

  async function updateUser(metadata: User, id: ID) {
    let newMetadata = { ...metadata }
    try {
      if (newMetadata.updatedProfilePicture) {
        const resp = await audiusLibs.File.uploadImage(
          newMetadata.updatedProfilePicture.file
        )
        newMetadata.profile_picture_sizes = resp.dirCID
      }

      if (newMetadata.updatedCoverPhoto) {
        const resp = await audiusLibs.File.uploadImage(
          newMetadata.updatedCoverPhoto.file,
          false
        )
        newMetadata.cover_photo_sizes = resp.dirCID
      }
      if (
        typeof newMetadata.twitter_handle === 'string' ||
        typeof newMetadata.instagram_handle === 'string' ||
        typeof newMetadata.tiktok_handle === 'string' ||
        typeof newMetadata.website === 'string' ||
        typeof newMetadata.donation === 'string'
      ) {
        await fetch(`${identityServiceUrl}/social_handles`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            handle: newMetadata.handle,
            twitterHandle: newMetadata.twitter_handle,
            instagramHandle: newMetadata.instagram_handle,
            website: newMetadata.website,
            donation: newMetadata.donation
          })
        })
      }

      newMetadata = schemas.newUserMetadata(newMetadata, true)

      const { blockHash, blockNumber } = await audiusLibs.User.updateUser(
        id,
        newMetadata
      )
      return { blockHash, blockNumber }
    } catch (err) {
      console.error(getErrorMessage(err))
      throw err
    }
  }

  async function updateIsVerified(userId: ID, verified: boolean) {
    try {
      await audiusLibs.User.updateIsVerified(userId, verified)
      return true
    } catch (err) {
      console.log(getErrorMessage(err))
      return false
    }
  }

  async function followUser(followeeUserId: ID) {
    try {
      return await audiusLibs.User.addUserFollow(followeeUserId)
    } catch (err) {
      console.log(getErrorMessage(err))
      throw err
    }
  }

  async function unfollowUser(followeeUserId: ID) {
    try {
      return await audiusLibs.User.deleteUserFollow(followeeUserId)
    } catch (err) {
      console.log(getErrorMessage(err))
      throw err
    }
  }

  async function getFolloweeFollows(userId: ID, limit = 100, offset = 0) {
    let followers = []
    try {
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
      console.log(getErrorMessage(err))
    }

    return followers
  }

  async function getPlaylists(userId: Nullable<ID>, playlistIds: ID[]) {
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
        true
      )
      return (playlists || []).map(getCollectionImages)
    } catch (err) {
      console.log(getErrorMessage(err))
      return []
    }
  }

  async function createPlaylist(
    playlistId: ID,
    userId: ID,
    metadata: Collection,
    isAlbum = false,
    trackIds = [],
    isPrivate = true
  ) {
    const playlistName = metadata.playlist_name
    const coverArt = metadata.artwork ? metadata.artwork.file : null
    const description = metadata.description
    // Creating an album is automatically public.
    if (isAlbum) isPrivate = false

    try {
      const playlistEntityManagerIsEnabled =
        (await getFeatureEnabled(
          FeatureFlags.PLAYLIST_ENTITY_MANAGER_ENABLED
        )) ?? false

      let response
      if (playlistEntityManagerIsEnabled) {
        const web3 = await audiusLibs.web3Manager.getWeb3()
        const currentBlockNumber = await web3.eth.getBlockNumber()
        const currentBlock = await web3.eth.getBlock(currentBlockNumber)
        const playlistTracks = trackIds.map((trackId) => ({
          track: trackId,
          metadata_time: currentBlock.timestamp
        }))
        response = await audiusLibs.EntityManager.createPlaylist({
          ...metadata,
          playlist_id: playlistId,
          playlist_contents: { track_ids: playlistTracks },
          is_album: isAlbum,
          is_private: isPrivate
        })
        const { blockHash, blockNumber, error } = response
        if (error) return { playlistId, error }
        return { blockHash, blockNumber, playlistId }
      } else {
        const response = await audiusLibs.Playlist.createPlaylist(
          userId,
          playlistName,
          isPrivate,
          isAlbum,
          trackIds
        )
        let { blockHash, blockNumber, playlistId, error } = response

        if (error) return { playlistId, error }

        const updatePromises: Promise<any>[] = []

        // If this playlist is being created from an existing cover art, use it.
        if (metadata.cover_art_sizes) {
          updatePromises.push(
            audiusLibs.contracts.PlaylistFactoryClient.updatePlaylistCoverPhoto(
              playlistId,
              BackendUtils.formatOptionalMultihash(metadata.cover_art_sizes)
            )
          )
        } else if (coverArt) {
          updatePromises.push(
            audiusLibs.Playlist.updatePlaylistCoverPhoto(playlistId, coverArt)
          )
        }
        if (description) {
          updatePromises.push(
            audiusLibs.Playlist.updatePlaylistDescription(
              playlistId,
              description
            )
          )
        }

        /**
         * find the latest transaction i.e. latest block number among the return transaction receipts
         * and return that block number along with its corresponding block hash
         */
        if (updatePromises.length > 0) {
          const latestReceipt = getLatestTxReceipt(
            await Promise.all(updatePromises)
          ) as TransactionReceipt
          blockHash = latestReceipt.blockHash
          blockNumber = latestReceipt.blockNumber
        }

        return { blockHash, blockNumber, playlistId }
      }
    } catch (err) {
      // This code path should never execute
      console.debug('Reached client createPlaylist catch block')
      console.log(getErrorMessage(err))
      return { playlistId: null, error: true }
    }
  }

  async function updatePlaylist(playlistId: ID, metadata: Collection) {
    const playlistName = metadata.playlist_name
    const coverPhoto = metadata.artwork?.file
    const description = metadata.description

    try {
      const playlistEntityManagerIsEnabled =
        (await getFeatureEnabled(
          FeatureFlags.PLAYLIST_ENTITY_MANAGER_ENABLED
        )) ?? false
      if (playlistEntityManagerIsEnabled) {
        const { blockHash, blockNumber } =
          await audiusLibs.EntityManager.updatePlaylist(metadata)

        return { blockHash, blockNumber }
      } else {
        let blockHash, blockNumber
        const promises: Promise<any>[] = []
        if (playlistName) {
          promises.push(
            audiusLibs.Playlist.updatePlaylistName(playlistId, playlistName)
          )
        }
        if (coverPhoto) {
          promises.push(
            audiusLibs.Playlist.updatePlaylistCoverPhoto(playlistId, coverPhoto)
          )
        }
        if (description) {
          promises.push(
            audiusLibs.Playlist.updatePlaylistDescription(
              playlistId,
              description
            )
          )
        }

        /**
         * find the latest transaction i.e. latest block number among the return transaction receipts
         * and return that block number along with its corresponding block hash
         */
        if (promises.length > 0) {
          const latestReceipt = getLatestTxReceipt(await Promise.all(promises))
          blockHash = latestReceipt.blockHash
          blockNumber = latestReceipt.blockNumber
        }
        return { blockHash, blockNumber }
      }
    } catch (error) {
      console.error(getErrorMessage(error))
      return { error }
    }
  }

  async function orderPlaylist(
    playlistId: ID,
    trackIds: PlaylistTrackId[],
    retries: number,
    playlist: any
  ) {
    try {
      const playlistEntityManagerIsEnabled =
        (await getFeatureEnabled(
          FeatureFlags.PLAYLIST_ENTITY_MANAGER_ENABLED
        )) ?? false
      if (playlistEntityManagerIsEnabled) {
        const { blockHash, blockNumber } =
          await audiusLibs.EntityManager.updatePlaylist(playlist)
        return { blockHash, blockNumber }
      } else {
        const { blockHash, blockNumber } =
          await audiusLibs.Playlist.orderPlaylistTracks(
            playlistId,
            trackIds,
            retries
          )
        return { blockHash, blockNumber }
      }
    } catch (error) {
      console.error(getErrorMessage(error))
      return { error }
    }
  }

  async function publishPlaylist(playlistId: ID, playlist: Collection) {
    try {
      const playlistEntityManagerIsEnabled =
        (await getFeatureEnabled(
          FeatureFlags.PLAYLIST_ENTITY_MANAGER_ENABLED
        )) ?? false
      if (playlistEntityManagerIsEnabled) {
        playlist.is_private = false
        const { blockHash, blockNumber } =
          await audiusLibs.EntityManager.updatePlaylist({
            ...playlist,
            is_private: false
          })
        return { blockHash, blockNumber }
      } else {
        const { blockHash, blockNumber } =
          await audiusLibs.Playlist.updatePlaylistPrivacy(playlistId, false)
        return { blockHash, blockNumber }
      }
    } catch (error) {
      console.error(getErrorMessage(error))
      return { error }
    }
  }

  async function addPlaylistTrack(
    playlistId: ID,
    trackId: ID,
    playlist: Collection
  ) {
    try {
      const playlistEntityManagerIsEnabled =
        (await getFeatureEnabled(
          FeatureFlags.PLAYLIST_ENTITY_MANAGER_ENABLED
        )) ?? false
      if (playlistEntityManagerIsEnabled) {
        const { blockHash, blockNumber } =
          await audiusLibs.EntityManager.updatePlaylist(playlist)
        return { blockHash, blockNumber }
      } else {
        const { blockHash, blockNumber } =
          await audiusLibs.Playlist.addPlaylistTrack(playlistId, trackId)
        return { blockHash, blockNumber }
      }
    } catch (error) {
      console.error(getErrorMessage(error))
      return { error }
    }
  }

  async function deletePlaylistTrack(
    playlistId: ID,
    trackId: ID,
    timestamp: string,
    retries: number,
    playlist: Collection,
    playlistEntityManagerIsEnabled = false
  ) {
    try {
      if (playlistEntityManagerIsEnabled) {
        const { blockHash, blockNumber } =
          await audiusLibs.EntityManager.updatePlaylist(playlist)
        return { blockHash, blockNumber }
      } else {
        const { blockHash, blockNumber } =
          await audiusLibs.Playlist.deletePlaylistTrack(
            playlistId,
            trackId,
            timestamp,
            retries
          )
        return { blockHash, blockNumber }
      }
    } catch (error) {
      console.error(getErrorMessage(error))
      return { error }
    }
  }

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
  async function dangerouslySetPlaylistOrder(
    playlistId: ID,
    trackIds: PlaylistTrackId[]
  ) {
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
      const playlistEntityManagerIsEnabled =
        (await getFeatureEnabled(
          FeatureFlags.PLAYLIST_ENTITY_MANAGER_ENABLED
        )) ?? false
      let txReceipt
      if (playlistEntityManagerIsEnabled) {
        txReceipt = await audiusLibs.EntityManager.deletePlaylist(playlistId)
      } else {
        txReceipt = await audiusLibs.Playlist.deletePlaylist(playlistId)
      }
      return {
        blockHash: txReceipt.blockHash,
        blockNumber: txReceipt.blockNumber
      }
    } catch (error) {
      console.error(getErrorMessage(error))
      return { error }
    }
  }

  async function deleteAlbum(playlistId: ID, trackIds: PlaylistTrackId[]) {
    try {
      console.debug(
        `Deleting Album ${playlistId}, tracks: ${JSON.stringify(
          trackIds.map((t) => t.track)
        )}`
      )
      const trackDeletionPromises = trackIds.map((t) =>
        audiusLibs.Track.deleteTrack(t.track)
      )
      const playlistEntityManagerIsEnabled =
        (await getFeatureEnabled(
          FeatureFlags.PLAYLIST_ENTITY_MANAGER_ENABLED
        )) ?? false
      let playlistDeletionPromise
      if (playlistEntityManagerIsEnabled) {
        playlistDeletionPromise =
          audiusLibs.EntityManager.deletePlaylist(playlistId)
      } else {
        playlistDeletionPromise = audiusLibs.Playlist.deletePlaylist(playlistId)
      }
      const results = await Promise.all(
        trackDeletionPromises.concat(playlistDeletionPromise)
      )
      const deleteTrackReceipts = results.slice(0, -1).map((r) => r.txReceipt)
      const deletePlaylistReceipt = results.slice(-1)[0].txReceipt

      return getLatestTxReceipt(
        deleteTrackReceipts.concat(deletePlaylistReceipt)
      )
    } catch (error) {
      console.error(getErrorMessage(error))
      return { error }
    }
  }

  async function getSavedPlaylists(limit = 100, offset = 0) {
    try {
      const saves = await withEagerOption(
        {
          normal: (libs) => libs.Playlist.getSavedPlaylists,
          eager: DiscoveryAPI.getSavedPlaylists
        },
        limit,
        offset
      )
      return saves.map((save: { save_item_id: ID }) => save.save_item_id)
    } catch (err) {
      console.log(getErrorMessage(err))
      return []
    }
  }

  async function getSavedAlbums(limit = 100, offset = 0) {
    try {
      const saves = await withEagerOption(
        {
          normal: (libs) => libs.Playlist.getSavedAlbums,
          eager: DiscoveryAPI.getSavedAlbums
        },
        limit,
        offset
      )
      return saves.map((save: { save_item_id: ID }) => save.save_item_id)
    } catch (err) {
      console.log(getErrorMessage(err))
      return []
    }
  }

  async function getSavedTracks(limit = 100, offset = 0) {
    try {
      return withEagerOption(
        {
          normal: (libs) => libs.Track.getSavedTracks,
          eager: DiscoveryAPI.getSavedTracks
        },
        limit,
        offset
      )
    } catch (err) {
      console.log(getErrorMessage(err))
      return []
    }
  }

  // Favoriting a track
  async function saveTrack(trackId: ID) {
    try {
      return await audiusLibs.Track.addTrackSave(trackId)
    } catch (err) {
      console.log(getErrorMessage(err))
      throw err
    }
  }

  async function deleteTrack(trackId: ID) {
    try {
      const { txReceipt } = await audiusLibs.Track.deleteTrack(trackId)
      return {
        blockHash: txReceipt.blockHash,
        blockNumber: txReceipt.blockNumber
      }
    } catch (err) {
      console.log(getErrorMessage(err))
      throw err
    }
  }

  // Favorite a playlist
  async function saveCollection(playlistId: ID) {
    try {
      return await audiusLibs.Playlist.addPlaylistSave(playlistId)
    } catch (err) {
      console.log(getErrorMessage(err))
      throw err
    }
  }

  // Unfavoriting a track
  async function unsaveTrack(trackId: ID) {
    try {
      return await audiusLibs.Track.deleteTrackSave(trackId)
    } catch (err) {
      console.log(getErrorMessage(err))
      throw err
    }
  }

  // Unfavorite a playlist
  async function unsaveCollection(playlistId: ID) {
    try {
      return await audiusLibs.Playlist.deletePlaylistSave(playlistId)
    } catch (err) {
      console.log(getErrorMessage(err))
      throw err
    }
  }

  /**
   * Sets the artist pick for a user
   * @param {number?} trackId if null, unsets the artist pick
   */
  async function setArtistPick(trackId: Nullable<ID> = null) {
    await waitForLibsInit()
    try {
      const { data, signature } = await signData()
      return await fetch(`${identityServiceUrl}/artist_pick`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [AuthHeaders.Message]: data,
          [AuthHeaders.Signature]: signature
        },
        body: JSON.stringify({
          trackId
        })
      })
    } catch (err) {
      console.log(getErrorMessage(err))
      return false
    }
  }

  async function signIn(email: string, password: string) {
    await waitForLibsInit()
    return audiusLibs.Account.login(email, password)
  }

  async function signOut() {
    await waitForLibsInit()
    return audiusLibs.Account.logout()
  }

  /**
   * @param {string} email
   * @param {string} password
   * @param {Object} formFields {name, handle, profilePicture, coverPhoto, isVerified, location}
   * @param {boolean?} hasWallet the user already has a wallet but didn't complete sign up
   * @param {ID?} referrer the user_id of the account that referred this one
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
      location?: string
      profilePicture: File
      coverPhoto: File
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

    // Returns { userId, error, phase }
    return audiusLibs.Account.signUp(
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
      feePayerOverride
    )
  }

  async function resetPassword(email: string, password: string) {
    await waitForLibsInit()
    return audiusLibs.Account.resetPassword(email, password)
  }

  async function changePassword(
    email: string,
    password: string,
    oldpassword: string
  ) {
    await waitForLibsInit()
    return audiusLibs.Account.changePassword(email, password, oldpassword)
  }

  async function confirmCredentials(email: string, password: string) {
    await waitForLibsInit()
    return audiusLibs.Account.confirmCredentials(email, password)
  }

  async function sendRecoveryEmail() {
    await waitForLibsInit()
    const host = getHostUrl()
    return audiusLibs.Account.generateRecoveryLink({ host })
  }

  async function associateAudiusUserForAuth(email: string, handle: string) {
    await waitForLibsInit()
    try {
      await audiusLibs.Account.associateAudiusUserForAuth(email, handle)
      return { success: true }
    } catch (error) {
      console.error(getErrorMessage(error))
      return { success: false, error }
    }
  }

  async function emailInUse(email: string) {
    await waitForLibsInit()
    try {
      const { exists: emailExists } =
        await audiusLibs.Account.checkIfEmailRegistered(email)
      return emailExists
    } catch (error) {
      console.error(getErrorMessage(error))
      return true
    }
  }

  async function handleInUse(handle: string) {
    await waitForLibsInit()
    try {
      const handleIsValid = await audiusLibs.Account.handleIsValid(handle)
      return !handleIsValid
    } catch (error) {
      return true
    }
  }

  async function twitterHandle(handle: string) {
    await waitForLibsInit()
    try {
      const user = await audiusLibs.Account.lookupTwitterHandle(handle)
      return { success: true, user }
    } catch (error) {
      return { success: false, error }
    }
  }

  async function associateTwitterAccount(
    twitterId: string,
    userId: ID,
    handle: string
  ) {
    await waitForLibsInit()
    try {
      await audiusLibs.Account.associateTwitterUser(twitterId, userId, handle)
      return { success: true }
    } catch (error) {
      console.error(getErrorMessage(error))
      return { success: false, error }
    }
  }

  async function associateInstagramAccount(
    instagramId: string,
    userId: ID,
    handle: string
  ) {
    await waitForLibsInit()
    try {
      await audiusLibs.Account.associateInstagramUser(
        instagramId,
        userId,
        handle
      )
      return { success: true }
    } catch (error) {
      console.error(getErrorMessage(error))
      return { success: false, error }
    }
  }

  async function getNotifications({
    limit,
    timeOffset,
    withDethroned
  }: {
    limit: number
    timeOffset: string
    withDethroned: boolean
  }) {
    await waitForLibsInit()
    const account = audiusLibs.Account.getCurrentUser()
    if (!account) return
    try {
      const { data, signature } = await signData()
      const timeOffsetQuery = timeOffset
        ? `&timeOffset=${encodeURI(timeOffset)}`
        : ''
      const limitQuery = `&limit=${limit}`
      const handleQuery = `&handle=${account.handle}`
      const withDethronedQuery = withDethroned
        ? '&withSupporterDethroned=true'
        : ''
      // TODO: withRemix, withTrending, withRewards are always true and should be removed in a future release
      const notifications = await fetch(
        `${identityServiceUrl}/notifications?${limitQuery}${timeOffsetQuery}${handleQuery}${withDethronedQuery}&withTips=true&withRewards=true&withRemix=true&withTrendingTrack=true`,
        {
          headers: {
            'Content-Type': 'application/json',
            [AuthHeaders.Message]: data,
            [AuthHeaders.Signature]: signature
          }
        }
      ).then((res) => {
        if (res.status !== 200) {
          return {
            success: false,
            error: new Error('Invalid Server Response'),
            isRequestError: true
          }
        }
        return res.json()
      })
      return notifications
    } catch (e) {
      console.error(e)
      return { success: false, error: e, isRequestError: true }
    }
  }

  async function markAllNotificationAsViewed() {
    await waitForLibsInit()
    const account = audiusLibs.Account.getCurrentUser()
    if (!account) return
    try {
      const { data, signature } = await signData()
      return await fetch(`${identityServiceUrl}/notifications/all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [AuthHeaders.Message]: data,
          [AuthHeaders.Signature]: signature
        },
        body: JSON.stringify({ isViewed: true, clearBadges: !!nativeMobile })
      }).then((res) => res.json())
    } catch (e) {
      console.error(e)
    }
  }

  async function clearNotificationBadges() {
    await waitForLibsInit()
    const account = audiusLibs.Account.getCurrentUser()
    if (!account) return
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
    const account = audiusLibs.Account.getCurrentUser()
    if (!account) return
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

  async function updateEmailNotificationSettings(emailFrequency: string) {
    await waitForLibsInit()
    const account = audiusLibs.Account.getCurrentUser()
    if (!account) return
    try {
      const { data, signature } = await signData()
      const res = await fetch(`${identityServiceUrl}/notifications/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [AuthHeaders.Message]: data,
          [AuthHeaders.Signature]: signature
        },
        body: JSON.stringify({ settings: { emailFrequency } })
      }).then((res) => res.json())
      return res
    } catch (e) {
      console.error(e)
    }
  }

  async function updateNotificationSettings(
    settings: Partial<Record<BrowserNotificationSetting, boolean>>
  ) {
    await waitForLibsInit()
    const account = audiusLibs.Account.getCurrentUser()
    if (!account) return
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
    const account = audiusLibs.Account.getCurrentUser()
    if (!account) return
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
    const account = audiusLibs.Account.getCurrentUser()
    if (!account) return
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
    const account = audiusLibs.Account.getCurrentUser()
    if (!account) return
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
    const account = audiusLibs.Account.getCurrentUser()
    if (!account) return
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
    const account = audiusLibs.Account.getCurrentUser()
    if (!account) return
    try {
      const { data, signature } = await signData()
      return await fetch(`${identityServiceUrl}/push_notifications/settings`, {
        headers: {
          [AuthHeaders.Message]: data,
          [AuthHeaders.Signature]: signature
        }
      })
        .then((res) => res.json())
        .then((res) => res.settings)
    } catch (e) {
      console.error(e)
    }
  }

  async function registerDeviceToken(deviceToken: string, deviceType: string) {
    await waitForLibsInit()
    const account = audiusLibs.Account.getCurrentUser()
    if (!account) return
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
    const account = audiusLibs.Account.getCurrentUser()
    if (!account) return
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

  async function getUserSubscribed(userId: ID) {
    await waitForLibsInit()
    const account = audiusLibs.Account.getCurrentUser()
    if (!account) return
    try {
      const { data, signature } = await signData()
      return await fetch(
        `${identityServiceUrl}/notifications/subscription?userId=${userId}`,
        {
          headers: {
            [AuthHeaders.Message]: data,
            [AuthHeaders.Signature]: signature
          }
        }
      )
        .then((res) => res.json())
        .then((res) =>
          res.users && res.users[userId.toString()]
            ? res.users[userId.toString()].isSubscribed
            : false
        )
    } catch (e) {
      console.error(e)
    }
  }

  async function getUserSubscriptions(userIds: ID[]) {
    await waitForLibsInit()
    const account = audiusLibs.Account.getCurrentUser()
    if (!account) return
    try {
      const { data, signature } = await signData()
      return await fetch(
        `${identityServiceUrl}/notifications/subscription?${userIds
          .map((id) => `userId=${id}`)
          .join('&')}`,
        {
          headers: {
            [AuthHeaders.Message]: data,
            [AuthHeaders.Signature]: signature
          }
        }
      )
        .then((res) => res.json())
        .then((res) => res.users)
    } catch (e) {
      console.error(e)
    }
  }

  async function updateUserSubscription(userId: ID, isSubscribed: boolean) {
    await waitForLibsInit()
    const account = audiusLibs.Account.getCurrentUser()
    if (!account) return
    try {
      const { data, signature } = await signData()
      return await fetch(`${identityServiceUrl}/notifications/subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [AuthHeaders.Message]: data,
          [AuthHeaders.Signature]: signature
        },
        body: JSON.stringify({
          userId,
          isSubscribed
        })
      }).then((res) => res.json())
    } catch (e) {
      console.error(e)
    }
  }

  async function updateUserLocationTimezone() {
    await waitForLibsInit()
    const account = audiusLibs.Account.getCurrentUser()
    if (!account) return
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
    const account = audiusLibs.Account.getCurrentUser()
    if (!account) return
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
    const account = audiusLibs.Account.getCurrentUser()
    if (!account) return
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
  async function updatePlaylistLastViewedAt(playlistId: ID) {
    if (!(await getFeatureEnabled(FeatureFlags.PLAYLIST_UPDATES_ENABLED)))
      return

    await waitForLibsInit()
    const account = audiusLibs.Account.getCurrentUser()
    if (!account) return

    try {
      const { data, signature } = await signData()
      return await fetch(
        `${identityServiceUrl}/user_playlist_updates?walletAddress=${account.wallet}&playlistId=${playlistId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            [AuthHeaders.Message]: data,
            [AuthHeaders.Signature]: signature
          }
        }
      )
    } catch (err) {
      console.log(getErrorMessage(err))
      return false
    }
  }

  async function updateHCaptchaScore(token: string) {
    await waitForLibsInit()
    const account = audiusLibs.Account.getCurrentUser()
    if (!account) return { error: true }

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
      console.log(getErrorMessage(err))
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
      console.log(getErrorMessage(err))
      return { error: true }
    }
  }

  /**
   * Retrieves the claim distribution amount
   * @returns {BN} amount The claim amount
   */
  async function getClaimDistributionAmount() {
    await waitForLibsInit()
    const wallet = audiusLibs.web3Manager.getWalletAddress()
    if (!wallet) return

    try {
      const amount = await audiusLibs.Account.getClaimDistributionAmount()
      return amount
    } catch (e) {
      console.error(e)
      return null
    }
  }

  /**
   * Make the claim for the distribution
   * NOTE: if the claim was already made, the response will 500 and error
   * @returns {Promise<boolean>} didMakeClaim
   */
  async function makeDistributionClaim() {
    await waitForLibsInit()
    const wallet = audiusLibs.web3Manager.getWalletAddress()
    if (!wallet) return null

    await audiusLibs.Account.makeDistributionClaim()
    return true
  }

  /**
   * Make a request to check if the user has already claimed
   * @returns {Promise<boolean>} doesHaveClaim
   */
  async function getHasClaimed() {
    await waitForLibsInit()
    const wallet = audiusLibs.web3Manager.getWalletAddress()
    if (!wallet) return

    try {
      const hasClaimed = await audiusLibs.Account.getHasClaimed()
      return hasClaimed
    } catch (e) {
      console.error(e)
      return null
    }
  }

  /**
   * Make a request to fetch the eth AUDIO balance of the the user
   * @params {bool} bustCache
   * @returns {Promise<BN>} balance
   */
  async function getBalance(bustCache = false) {
    await waitForLibsInit()
    const wallet = audiusLibs.web3Manager.getWalletAddress()
    if (!wallet) return

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
      return null
    }
  }

  /**
   * Make a request to fetch the sol wrapped audio balance of the the user
   * @returns {Promise<BN>} balance
   */
  async function getWAudioBalance() {
    await waitForLibsInit()

    try {
      const userBank = await audiusLibs.solanaWeb3Manager.deriveUserBank()
      const ownerWAudioBalance =
        await audiusLibs.solanaWeb3Manager.getWAudioBalance(userBank)
      if (!ownerWAudioBalance) {
        console.error('Failed to fetch account waudio balance')
        return new BN('0')
      }
      return ownerWAudioBalance
    } catch (e) {
      console.error(e)
      return new BN('0')
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
   * @returns {Promise<BN>} balance
   */
  async function getAddressTotalStakedBalance(
    address: string,
    bustCache = false
  ) {
    await waitForLibsInit()
    if (!address) return

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
        mintKey: audiusLibs.solanaWeb3Manager.mintKey,
        solanaTokenProgramKey: audiusLibs.solanaWeb3Manager.solanaTokenKey,
        connection: audiusLibs.solanaWeb3Manager.connection
      })
      const { signature } = await window.solana.signAndSendTransaction(tx)
      await audiusLibs.solanaWeb3Manager.connection.confirmTransaction(
        signature
      )
    }
    return audiusLibs.solanaWeb3Manager.transferWAudio(address, amount)
  }

  async function getSignature(data: any) {
    await waitForLibsInit()
    return audiusLibs.web3Manager.sign(data)
  }

  /**
   * Get latest transaction receipt based on block number
   * Used by confirmer
   */
  function getLatestTxReceipt(receipts: TransactionReceipt[]) {
    if (!receipts.length) return {} as TransactionReceipt
    return receipts.sort((receipt1, receipt2) =>
      receipt1.blockNumber < receipt2.blockNumber ? 1 : -1
    )[0]
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
  async function transferAudioToWAudio(balance: number) {
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
   * @returns {Promise<BN>}
   */
  async function getAddressWAudioBalance(address: string) {
    await waitForLibsInit()
    const waudioBalance = await audiusLibs.solanaWeb3Manager.getWAudioBalance(
      address
    )
    if (!waudioBalance) {
      console.error(`Failed to get waudio balance for address: ${address}`)
      return new BN('0')
    }
    return waudioBalance
  }

  /**
   * Aggregate, submit, and evaluate attestations for a given challenge for a user
   */
  async function submitAndEvaluateAttestations({
    challenges,
    userId,
    handle,
    recipientEthAddress,
    oracleEthAddress,
    amount,
    quorumSize,
    endpoints,
    AAOEndpoint,
    parallelization,
    feePayerOverride
  }: {
    challenges: { challenge_id: ChallengeRewardID; specifier: string }[]
    userId: ID
    handle: string
    recipientEthAddress: string
    oracleEthAddress: string
    amount: number
    quorumSize: number
    endpoints: string[]
    AAOEndpoint: string
    parallelization: number
    feePayerOverride: Nullable<string>
    isFinalAttempt: boolean
  }) {
    await waitForLibsInit()
    try {
      if (!challenges.length) return

      const source = isMobile ? 'mobile' : isElectron ? 'electron' : 'web'
      const reporter = new ClientRewardsReporter({
        libs: audiusLibs,
        recordAnalytics,
        source,
        reportError
      })

      const encodedUserId = encodeHashId(userId)

      const attester = new AudiusLibs.RewardsAttester({
        libs: audiusLibs,
        parallelization,
        quorumSize,
        aaoEndpoint: AAOEndpoint,
        aaoAddress: oracleEthAddress,
        endpoints,
        feePayerOverride,
        reporter
      })

      const res = await attester.processChallenges(
        challenges.map(({ specifier, challenge_id: challengeId }) => ({
          specifier,
          challengeId,
          userId: encodedUserId,
          amount,
          handle,
          wallet: recipientEthAddress
        }))
      )
      if (res.errors) {
        console.error(
          `Got errors in processChallenges: ${JSON.stringify(res.errors)}`
        )
        const hcaptchaOrCognito = res.errors.find(
          ({ error }: { error: FailureReason }) =>
            error === FailureReason.HCAPTCHA ||
            error === FailureReason.COGNITO_FLOW
        )

        // If any of the errors are HCAPTCHA or Cognito, return that one
        // Otherwise, just return the first error we saw
        const error = hcaptchaOrCognito
          ? hcaptchaOrCognito.error
          : res.errors[0].error
        const aaoErrorCode = res.errors[0].aaoErrorCode

        return { error, aaoErrorCode }
      }
      return res
    } catch (e) {
      console.log(`Failed in libs call to claim reward`)
      console.error(e)
      return { error: true }
    }
  }

  async function getAudiusLibs() {
    await waitForLibsInit()
    return audiusLibs
  }

  async function getWeb3() {
    const audiusLibs = await getAudiusLibs()
    return audiusLibs.web3Manager.getWeb3()
  }

  return {
    addDiscoveryProviderSelectionListener,
    addPlaylistTrack,
    audiusLibs,
    associateAudiusUserForAuth,
    associateInstagramAccount,
    associateTwitterAccount,
    autoSelectCreatorNodes,
    changePassword,
    clearNotificationBadges,
    confirmCredentials,
    createPlaylist,
    creatorNodeSelectionCallback,
    currentDiscoveryProvider,
    dangerouslySetPlaylistOrder,
    deleteAlbum,
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
    getAccount,
    getAddressTotalStakedBalance,
    getAddressWAudioBalance,
    getAddressSolBalance,
    getAssociatedTokenAccountInfo,
    getAllTracks,
    getArtistTracks,
    getAudiusLibs,
    getBalance,
    getBrowserPushNotificationSettings,
    getBrowserPushSubscription,
    getClaimDistributionAmount,
    getCollectionImages,
    getCreatorNodeIPFSGateways,
    getCreators,
    getCreatorSocialHandle,
    getEmailNotificationSettings,
    getFolloweeFollows,
    getHasClaimed,
    getImageUrl,
    getLatestTxReceipt,
    getNotifications,
    getPlaylists,
    getPushNotificationSettings,
    getRandomFeePayer,
    getSafariBrowserPushEnabled,
    getSavedAlbums,
    getSavedPlaylists,
    getSavedTracks,
    getSelectableCreatorNodes,
    getSignature,
    getSocialFeed,
    getTrackImages,
    getTrackListens,
    getTracksIncludingUnlisted,
    getUserEmail,
    getUserFeed,
    getUserImages,
    getUserSubscribed,
    getUserSubscriptions,
    getWAudioBalance,
    getWeb3,
    handleInUse,
    identityServiceUrl,
    isCreatorNodeSyncing,
    legacyUserNodeUrl,
    listCreatorNodes,
    makeDistributionClaim,
    markAllNotificationAsViewed,
    orderPlaylist,
    publishPlaylist,
    recordTrackListen,
    registerDeviceToken,
    registerUploadedTracks,
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
    setArtistPick,
    setCreatorNodeEndpoint,
    setup,
    signData,
    signDiscoveryNodeRequest,
    signIn,
    signOut,
    signUp,
    submitAndEvaluateAttestations,
    transferAudioToWAudio,
    twitterHandle,
    undoRepostCollection,
    undoRepostTrack,
    unfollowUser,
    unsaveCollection,
    unsaveTrack,
    updateBrowserNotifications,
    updateCreator,
    updateEmailNotificationSettings,
    updateHCaptchaScore,
    updateIsVerified,
    updateNotificationSettings,
    updatePlaylist,
    updatePlaylistLastViewedAt,
    updatePushNotificationSettings,
    updateTrack,
    updateUser,
    updateUserEvent,
    updateUserLocationTimezone,
    updateUserSubscription,
    upgradeToCreator,
    uploadImage: instrumentTracing({
      fn: uploadImage,
      context: this,
      tracer
    }),
    uploadTrack: instrumentTracing({
      fn: uploadTrack,
      context: this,
      tracer
    }),
    uploadTrackToCreatorNode: instrumentTracing({
      fn: uploadTrackToCreatorNode,
      context: this,
      tracer
    }),
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
  console.log({
    SYSVAR_RENT_PUBKEY,
    solanaTokenProgramKey
  })

  console.log({
    SystemProgram
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
