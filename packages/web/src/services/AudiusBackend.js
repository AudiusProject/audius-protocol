/* globals web3, localStorage, fetch, Image */

import * as DiscoveryAPI from '@audius/libs/src/services/discoveryProvider/requests'
import * as IdentityAPI from '@audius/libs/src/services/identity/requests'
import BN from 'bn.js'
import moment from 'moment-timezone'

import placeholderCoverArt from 'assets/img/imageBlank2x.png'
import imageCoverPhotoBlank from 'assets/img/imageCoverPhotoBlank.jpg'
import placeholderProfilePicture from 'assets/img/imageProfilePicEmpty2X.png'
import { Name } from 'common/models/Analytics'
import FeedFilter from 'common/models/FeedFilter'
import { DefaultSizes } from 'common/models/ImageSizes'
import CIDCache from 'common/store/cache/CIDCache'
import { Nullable } from 'common/utils/typeUtils'
import { uuid } from 'common/utils/uid'
import * as schemas from 'schemas'
import {
  IntKeys,
  getRemoteVar,
  StringKeys,
  BooleanKeys,
  FeatureFlags
} from 'services/remote-config'
import { IS_MOBILE_USER_KEY } from 'store/account/mobileSagas'
import { track } from 'store/analytics/providers/amplitude'
import { isElectron } from 'utils/clientUtil'
import { getCreatorNodeIPFSGateways } from 'utils/gatewayUtil'
import { Timer } from 'utils/performance'

import {
  waitForLibsInit,
  withEagerOption,
  LIBS_INITTED_EVENT
} from './audius-backend/eagerLoadUtils'
import {
  getFeatureEnabled,
  waitForRemoteConfig
} from './remote-config/Provider'
import { monitoringCallbacks } from './serviceMonitoring'

export const IDENTITY_SERVICE = process.env.REACT_APP_IDENTITY_SERVICE
export const USER_NODE = process.env.REACT_APP_USER_NODE
export const LEGACY_USER_NODE = process.env.REACT_APP_LEGACY_USER_NODE

const REGISTRY_ADDRESS = process.env.REACT_APP_REGISTRY_ADDRESS
const WEB3_PROVIDER_URLS = (
  process.env.REACT_APP_WEB3_PROVIDER_URL || ''
).split(',')
const WEB3_NETWORK_ID = process.env.REACT_APP_WEB3_NETWORK_ID

const ETH_REGISTRY_ADDRESS = process.env.REACT_APP_ETH_REGISTRY_ADDRESS
const ETH_TOKEN_ADDRESS = process.env.REACT_APP_ETH_TOKEN_ADDRESS
const ETH_OWNER_WALLET = process.env.REACT_APP_ETH_OWNER_WALLET
const ETH_PROVIDER_URLS = (process.env.REACT_APP_ETH_PROVIDER_URL || '').split(
  ','
)
const CLAIM_DISTRIBUTION_CONTRACT_ADDRESS =
  process.env.REACT_APP_CLAIM_DISTRIBUTION_CONTRACT_ADDRESS

// Solana Config
const SOLANA_CLUSTER_ENDPOINT = process.env.REACT_APP_SOLANA_CLUSTER_ENDPOINT
const WAUDIO_MINT_ADDRESS = process.env.REACT_APP_WAUDIO_MINT_ADDRESS
const SOLANA_TOKEN_ADDRESS = process.env.REACT_APP_SOLANA_TOKEN_PROGRAM_ADDRESS
const CLAIMABLE_TOKEN_PDA = process.env.REACT_APP_CLAIMABLE_TOKEN_PDA
const SOLANA_FEE_PAYER_ADDRESS = process.env.REACT_APP_SOLANA_FEE_PAYER_ADDRESS

const CLAIMABLE_TOKEN_PROGRAM_ADDRESS =
  process.env.REACT_APP_CLAIMABLE_TOKEN_PROGRAM_ADDRESS
const WORMHOLE_ADDRESS = process.env.REACT_APP_WORMHOLE_ADDRESS
const REWARDS_MANAGER_PROGRAM_ID =
  process.env.REACT_APP_REWARDS_MANAGER_PROGRAM_ID
const REWARDS_MANAGER_PROGRAM_PDA =
  process.env.REACT_APP_REWARDS_MANAGER_PROGRAM_PDA
const REWARDS_MANAGER_TOKEN_PDA =
  process.env.REACT_APP_REWARDS_MANAGER_TOKEN_PDA

const RECAPTCHA_SITE_KEY = process.env.REACT_APP_RECAPTCHA_SITE_KEY

const SEARCH_MAX_SAVED_RESULTS = 10
const SEARCH_MAX_TOTAL_RESULTS = 50
const IMAGE_CACHE_MAX_SIZE = 200

const NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE
const AUDIUS_ORIGIN = `${process.env.REACT_APP_PUBLIC_PROTOCOL}//${process.env.REACT_APP_PUBLIC_HOSTNAME}`

export const AuthHeaders = Object.freeze({
  Message: 'Encoded-Data-Message',
  Signature: 'Encoded-Data-Signature'
})

export const waitForWeb3 = async () => {
  if (!window.web3Loaded) {
    await new Promise(resolve => {
      const onLoad = () => {
        window.removeEventListener('WEB3_LOADED', onLoad)
        resolve()
      }
      window.addEventListener('WEB3_LOADED', onLoad)
    })
  }
}

let AudiusLibs = null
export let Utils = null
let SanityChecks = null

let audiusLibs = null
const unauthenticatedUuid = uuid()
/**
 * Combines two lists by concatting `maxSaved` results from the `savedList` onto the head of `normalList`,
 * ensuring that no item is duplicated in the resulting list (deduped by `uniqueKey`). The final list length is capped
 * at `maxTotal` items.
 */
const combineLists = (
  savedList,
  normalList,
  uniqueKey,
  maxSaved = SEARCH_MAX_SAVED_RESULTS,
  maxTotal = SEARCH_MAX_TOTAL_RESULTS
) => {
  const truncatedSavedList = savedList.slice(
    0,
    Math.min(maxSaved, savedList.length)
  )
  const saveListsSet = new Set(truncatedSavedList.map(s => s[uniqueKey]))
  const filteredList = normalList.filter(n => !saveListsSet.has(n[uniqueKey]))
  const combinedLists = savedList.concat(filteredList)
  return combinedLists.slice(0, Math.min(maxTotal, combinedLists.length))
}

const notDeleted = e => !e.is_delete

export const fetchCID = async (
  cid,
  creatorNodeGateways = [],
  cache = true,
  asUrl = true,
  trackId = null
) => {
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
    console.error(e)
    return asUrl ? '' : null
  }
}

let preloadImageTimer
const avoidGC = []

const preloadImage = async url => {
  if (!preloadImageTimer) {
    const batchSize = getRemoteVar(
      IntKeys.IMAGE_QUICK_FETCH_PERFORMANCE_BATCH_SIZE
    )

    preloadImageTimer = new Timer({
      name: 'image_preload',
      batch: true,
      batchSize
    })
  }

  return new Promise(resolve => {
    const start = preloadImageTimer.start()

    const timeoutMs = getRemoteVar(IntKeys.IMAGE_QUICK_FETCH_TIMEOUT_MS)
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

const fetchImageCID = async (cid, creatorNodeGateways = [], cache = true) => {
  if (CIDCache.has(cid)) {
    return CIDCache.get(cid)
  }

  creatorNodeGateways.push(USER_NODE)

  const primary = creatorNodeGateways[0]
  if (primary) {
    // Attempt to fetch/load the image using the first creator node gateway
    const firstImageUrl = `${primary}${cid}`
    const preloadedImageUrl = await preloadImage(firstImageUrl)

    // If the image is loaded, add to cache and return
    if (preloadedImageUrl && cache) CIDCache.add(cid, preloadedImageUrl)
    if (preloadedImageUrl) return preloadedImageUrl
  }

  await waitForLibsInit()
  // Else, race fetching of the image from all gateways & return the image url blob
  try {
    const promises = [
      // Try to fetch the CID
      audiusLibs.File.fetchCID(cid, creatorNodeGateways, () => {}).catch(
        () => new Promise()
      )
    ]
    if (cid.includes('/')) {
      // Try to fetch the CID without the size if it is one with a size.
      // Very old users have set _sizes that point to a single CID,
      // not a folder of CIDs.
      // This code path should be executed very rarely.
      promises.push(
        audiusLibs.File.fetchCID(
          cid.split('/')[0],
          creatorNodeGateways,
          () => {}
        ).catch(() => new Promise())
      )
    }
    // Note: the raced promises here have a do-nothing .catch, which makes
    // this promise.race behave like promise.any
    const image = await Promise.race(promises)
    const url = URL.createObjectURL(image.data)
    if (cache) CIDCache.add(cid, url)
    return url
  } catch (e) {
    console.error(e)
    return ''
  }
}

class AudiusBackend {
  static currentDiscoveryProvider = null
  static didSelectDiscoveryProviderListeners = []
  static addDiscoveryProviderSelectionListener(listener) {
    AudiusBackend.didSelectDiscoveryProviderListeners.push(listener)
    if (AudiusBackend.currentDiscoveryProvider !== null) {
      listener(AudiusBackend.currentDiscoveryProvider)
    }
  }

  static async getImageUrl(cid, size, gateways) {
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

  static getTrackImages(track) {
    const coverArtSizes = {}
    if (!track.cover_art_sizes && !track.cover_art) {
      coverArtSizes[DefaultSizes.OVERRIDE] = placeholderCoverArt
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

  static getCollectionImages(collection) {
    const coverArtSizes = {}

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
      coverArtSizes[DefaultSizes.OVERRIDE] = placeholderCoverArt
    }

    return {
      ...collection,
      _cover_art_sizes: coverArtSizes
    }
  }

  static getUserImages(user) {
    const profilePictureSizes = {}
    const coverPhotoSizes = {}

    // Images are fetched on demand async w/ the `useUserProfilePicture`/`useUserCoverPhoto` and
    // transitioned in w/ the dynamicImageComponent
    if (!user.profile_picture_sizes && !user.profile_picture) {
      profilePictureSizes[DefaultSizes.OVERRIDE] = placeholderProfilePicture
    }

    if (!user.cover_photo_sizes && !user.cover_photo) {
      coverPhotoSizes[DefaultSizes.OVERRIDE] = imageCoverPhotoBlank
    }

    return {
      ...user,
      _profile_picture_sizes: profilePictureSizes,
      _cover_photo_sizes: coverPhotoSizes
    }
  }

  // Record the endpoint and reason for selecting the endpoint
  static discoveryProviderSelectionCallback(endpoint, decisionTree) {
    track(Name.DISCOVERY_PROVIDER_SELECTION, {
      endpoint,
      reason: decisionTree.map(reason => reason.stage).join(' -> ')
    })
    AudiusBackend.didSelectDiscoveryProviderListeners.forEach(listener =>
      listener(endpoint)
    )
  }

  static creatorNodeSelectionCallback(primary, secondaries, reason) {
    track(Name.CREATOR_NODE_SELECTION, {
      endpoint: primary,
      selectedAs: 'primary',
      reason
    })
    secondaries.forEach(secondary => {
      track(Name.CREATOR_NODE_SELECTION, {
        endpoint: secondary,
        selectedAs: 'secondary',
        reason
      })
    })
  }

  static async sanityChecks(audiusLibs) {
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

  static async setup() {
    // Wait for web3 to load if necessary
    await waitForWeb3()
    // Wait for optimizely to load if necessary
    await waitForRemoteConfig()

    const { libs, libsUtils, libsSanityChecks } = await import(
      './audius-backend/AudiusLibsLazyLoader'
    ).then(libs => {
      return {
        libs: libs.default,
        libsUtils: libs.Utils,
        libsSanityChecks: libs.SanityChecks
      }
    })
    AudiusLibs = libs
    Utils = libsUtils
    SanityChecks = libsSanityChecks

    // initialize libs
    let libsError = null
    const { web3Error, web3Config } = await AudiusBackend.getWeb3Config()
    const { ethWeb3Config } = AudiusBackend.getEthWeb3Config()
    const { solanaWeb3Config } = AudiusBackend.getSolanaWeb3Config()

    let contentNodeBlockList = getRemoteVar(StringKeys.CONTENT_NODE_BLOCK_LIST)
    if (contentNodeBlockList) {
      try {
        contentNodeBlockList = new Set(contentNodeBlockList.split(','))
      } catch (e) {
        console.error(e)
        contentNodeBlockList = null
      }
    }
    let discoveryNodeBlockList = getRemoteVar(
      StringKeys.DISCOVERY_NODE_BLOCK_LIST
    )
    if (discoveryNodeBlockList) {
      try {
        discoveryNodeBlockList = new Set(discoveryNodeBlockList.split(','))
      } catch (e) {
        console.error(e)
        discoveryNodeBlockList = null
      }
    }

    try {
      audiusLibs = new AudiusLibs({
        web3Config,
        ethWeb3Config,
        solanaWeb3Config,
        discoveryProviderConfig: AudiusLibs.configDiscoveryProvider(
          null,
          discoveryNodeBlockList,
          getRemoteVar(IntKeys.DISCOVERY_PROVIDER_SELECTION_TIMEOUT_MS),
          AudiusBackend.discoveryProviderSelectionCallback,
          monitoringCallbacks.discoveryNode,
          getRemoteVar(IntKeys.DISCOVERY_NODE_SELECTION_REQUEST_TIMEOUT),
          getRemoteVar(IntKeys.DISCOVERY_NODE_SELECTION_REQUEST_RETRIES)
        ),
        identityServiceConfig: AudiusLibs.configIdentityService(
          IDENTITY_SERVICE
        ),
        creatorNodeConfig: AudiusLibs.configCreatorNode(
          USER_NODE,
          /* lazyConnect */ true,
          /* passList */ null,
          contentNodeBlockList,
          monitoringCallbacks.contentNode
        ),
        // Electron cannot use captcha until it serves its assets from
        // a "domain" (e.g. localhost) rather than the file system itself.
        // i.e. there is no way to instruct captcha that the domain is "file://"
        captchaConfig: isElectron()
          ? undefined
          : { siteKey: RECAPTCHA_SITE_KEY },
        isServer: false,
        useTrackContentPolling: getFeatureEnabled(
          FeatureFlags.USE_TRACK_CONTENT_POLLING
        ),
        useResumableTrackUpload: getFeatureEnabled(
          FeatureFlags.USE_RESUMABLE_TRACK_UPLOAD
        )
      })
      await audiusLibs.init()
      window.audiusLibs = audiusLibs
      const event = new CustomEvent(LIBS_INITTED_EVENT)
      window.dispatchEvent(event)

      AudiusBackend.sanityChecks(audiusLibs)
    } catch (err) {
      console.log(err)
      libsError = err.message
    }

    // Web3Error allows for metamask to be improperly configured
    // but reads to still work in app. libsError should be treated as fatal.
    return { web3Error, libsError }
  }

  static getEthWeb3Config() {
    const ethProviderUrls =
      getRemoteVar(StringKeys.ETH_PROVIDER_URLS) || ETH_PROVIDER_URLS
    return {
      ethWeb3Config: AudiusLibs.configEthWeb3(
        ETH_TOKEN_ADDRESS,
        ETH_REGISTRY_ADDRESS,
        ethProviderUrls,
        ETH_OWNER_WALLET,
        CLAIM_DISTRIBUTION_CONTRACT_ADDRESS,
        WORMHOLE_ADDRESS
      )
    }
  }

  static async getWeb3Config() {
    const useMetaMaskSerialized = localStorage.getItem('useMetaMask')
    const useMetaMask = useMetaMaskSerialized
      ? JSON.parse(useMetaMaskSerialized)
      : false

    if (useMetaMask && window.web3) {
      try {
        return {
          error: false,
          web3Config: await AudiusLibs.configExternalWeb3(
            REGISTRY_ADDRESS,
            web3.currentProvider,
            WEB3_NETWORK_ID
          )
        }
      } catch (e) {
        return {
          error: true,
          web3Config: AudiusLibs.configInternalWeb3(
            REGISTRY_ADDRESS,
            WEB3_PROVIDER_URLS
          )
        }
      }
    }
    return {
      error: false,
      web3Config: AudiusLibs.configInternalWeb3(
        REGISTRY_ADDRESS,
        WEB3_PROVIDER_URLS
      )
    }
  }

  static getSolanaWeb3Config() {
    if (
      !SOLANA_CLUSTER_ENDPOINT ||
      !WAUDIO_MINT_ADDRESS ||
      !SOLANA_TOKEN_ADDRESS ||
      !SOLANA_FEE_PAYER_ADDRESS ||
      !CLAIMABLE_TOKEN_PROGRAM_ADDRESS ||
      !REWARDS_MANAGER_PROGRAM_ID ||
      !REWARDS_MANAGER_PROGRAM_PDA ||
      !REWARDS_MANAGER_TOKEN_PDA
    ) {
      console.error('Missing solana configs')
      return {
        error: true
      }
    }
    return {
      error: false,
      solanaWeb3Config: AudiusLibs.configSolanaWeb3({
        solanaClusterEndpoint: SOLANA_CLUSTER_ENDPOINT,
        mintAddress: WAUDIO_MINT_ADDRESS,
        solanaTokenAddress: SOLANA_TOKEN_ADDRESS,
        claimableTokenPDA: CLAIMABLE_TOKEN_PDA,
        feePayerAddress: SOLANA_FEE_PAYER_ADDRESS,
        claimableTokenProgramAddress: CLAIMABLE_TOKEN_PROGRAM_ADDRESS,
        rewardsManagerProgramId: REWARDS_MANAGER_PROGRAM_ID,
        rewardsManagerProgramPDA: REWARDS_MANAGER_PROGRAM_PDA,
        rewardsManagerTokenPDA: REWARDS_MANAGER_TOKEN_PDA,
        useRelay: true
      })
    }
  }

  static async setCreatorNodeEndpoint(endpoint) {
    return audiusLibs.creatorNode.setEndpoint(endpoint)
  }

  static async isCreatorNodeSyncing(endpoint) {
    try {
      const {
        isBehind,
        isConfigured
      } = await audiusLibs.creatorNode.getSyncStatus(endpoint)
      return isBehind && isConfigured
    } catch (e) {
      return true
    }
  }

  static async listCreatorNodes() {
    return audiusLibs.ServiceProvider.listCreatorNodes()
  }

  static async autoSelectCreatorNodes() {
    return audiusLibs.ServiceProvider.autoSelectCreatorNodes({})
  }

  static async getSelectableCreatorNodes() {
    let contentNodeBlockList = getRemoteVar(StringKeys.CONTENT_NODE_BLOCK_LIST)
    if (contentNodeBlockList) {
      try {
        contentNodeBlockList = new Set(contentNodeBlockList.split(','))
      } catch (e) {
        console.error(e)
        contentNodeBlockList = null
      }
    }
    return audiusLibs.ServiceProvider.getSelectableCreatorNodes(
      /* whitelist */ null,
      /* blacklist */ contentNodeBlockList
    )
  }

  static async getAccount(fromSource = false) {
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
        const body = await AudiusBackend.getCreatorSocialHandle(account.handle)
        account.twitter_handle = body.twitterHandle || null
        account.instagram_handle = body.instagramHandle || null
        account.tiktok_handle = body.tikTokHandle || null
        account.website = body.website || null
        account.donation = body.donation || null
        account._artist_pick = body.pinnedTrackId || null
        account.twitterVerified = body.twitterVerified || false
        account.instagramVerified = body.instagramVerified || false
        return AudiusBackend.getUserImages(account)
      } catch (e) {
        // Failed to fetch social handles and artist pick, but return what we have
        // in any case
        console.error(e)
        return AudiusBackend.getUserImages(account)
      }
    } catch (e) {
      console.error(e)
      // No account
      return null
    }
  }

  static async getAllTracks({
    offset,
    limit,
    idsArray,
    withUsers = true,
    filterDeletes = false
  }) {
    try {
      const tracks = await withEagerOption(
        {
          normal: libs => libs.Track.getTracks,
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
  static async getTracksIncludingUnlisted(identifiers, withUsers = true) {
    try {
      const tracks = await withEagerOption(
        {
          normal: libs => libs.Track.getTracksIncludingUnlisted,
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

  static async getUnlistedTracks() {
    try {
      return await audiusLibs.Track.getUnlistedTracks()
    } catch (e) {
      console.error(e)
      return []
    }
  }

  static async getArtistTracks({
    offset,
    limit,
    userId,
    sort = null,
    filterDeleted = null,
    withUsers = true
  }) {
    try {
      const tracks = await withEagerOption(
        { normal: libs => libs.Track.getTracks, eager: DiscoveryAPI.getTracks },
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

  static async getSocialFeed({
    filter,
    offset,
    limit,
    withUsers = true,
    tracksOnly = false
  }) {
    const filterMap = {
      [FeedFilter.ALL]: 'all',
      [FeedFilter.ORIGINAL]: 'original',
      [FeedFilter.REPOST]: 'repost'
    }

    let feedItems = []
    try {
      feedItems = await withEagerOption(
        {
          normal: libs => libs.User.getSocialFeed,
          eager: DiscoveryAPI.getSocialFeed,
          requiresUser: true
        },
        filterMap[filter],
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
    return feedItems.map(item => {
      if (item.playlist_id) return AudiusBackend.getCollectionImages(item)
      return item
    })
  }

  static async getUserFeed({ offset, limit, userId, withUsers = true }) {
    try {
      const tracks = await withEagerOption(
        {
          normal: libs => libs.User.getUserRepostFeed,
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

  static async searchTags({
    searchText,
    minTagThreshold,
    kind,
    offset,
    limit
  }) {
    try {
      const searchTags = await withEagerOption(
        {
          normal: libs => libs.Account.searchTags,
          eager: DiscoveryAPI.searchTags
        },
        searchText,
        minTagThreshold,
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
        combineLists(
          savedTracks.filter(notDeleted),
          tracks.filter(notDeleted),
          'track_id'
        ).map(async track => AudiusBackend.getTrackImages(track))
      )

      const combinedUsers = await Promise.all(
        combineLists(followedUsers, users, 'user_id').map(async user =>
          AudiusBackend.getUserImages(user)
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

  static async getTrackListens(trackIds, start, end, period) {
    if (trackIds.length === 0) return []
    try {
      return withEagerOption(
        {
          normal: libs => libs.Track.getTrackListens,
          eager: IdentityAPI.getTrackListens,
          endpoint: IDENTITY_SERVICE
        },
        period,
        trackIds,
        start,
        end,
        trackIds.length
      )
    } catch (err) {
      console.error(err.message)
      return []
    }
  }

  static async recordTrackListen(trackId) {
    try {
      const listen = await audiusLibs.Track.logTrackListen(
        trackId,
        unauthenticatedUuid,
        getFeatureEnabled(FeatureFlags.SOLANA_LISTEN_ENABLED)
      )
      return listen
    } catch (err) {
      console.error(err.message)
    }
  }

  static async getListenHistoryTracks(limit = 100, offset = 0) {
    await waitForLibsInit()
    try {
      const trackListens = await audiusLibs.Track.getListenHistoryTracks(
        limit,
        offset
      )

      return trackListens
    } catch (err) {
      console.error(err.message)
    }
  }

  static async repostTrack(trackId) {
    try {
      return audiusLibs.Track.addTrackRepost(trackId)
    } catch (err) {
      console.error(err.message)
      throw err
    }
  }

  static async undoRepostTrack(trackId) {
    try {
      return audiusLibs.Track.deleteTrackRepost(trackId)
    } catch (err) {
      console.error(err.message)
      throw err
    }
  }

  static async repostCollection(playlistId) {
    try {
      return audiusLibs.Playlist.addPlaylistRepost(playlistId)
    } catch (err) {
      console.error(err.message)
      throw err
    }
  }

  static async undoRepostCollection(playlistId) {
    try {
      return audiusLibs.Playlist.deletePlaylistRepost(playlistId)
    } catch (err) {
      console.error(err.message)
      throw err
    }
  }

  /**
   * Upgrades a user to a creator
   * @param {string} newCreatorNodeEndpoint will follow the structure 'cn1,cn2,cn3'
   */
  static async upgradeToCreator(newCreatorNodeEndpoint) {
    return audiusLibs.User.upgradeToCreator(USER_NODE, newCreatorNodeEndpoint)
  }

  // Uploads a single track
  // Returns { trackId, error, phase }
  static async uploadTrack(trackFile, coverArtFile, metadata, onProgress) {
    return await audiusLibs.Track.uploadTrack(
      trackFile,
      coverArtFile,
      metadata,
      onProgress
    )
  }

  // Used to upload multiple tracks as part of an album/playlist
  // Returns { metadataMultihash, metadataFileUUID, transcodedTrackCID, transcodedTrackUUID }
  static async uploadTrackToCreatorNode(
    trackFile,
    coverArtFile,
    metadata,
    onProgress
  ) {
    return audiusLibs.Track.uploadTrackContentToCreatorNode(
      trackFile,
      coverArtFile,
      metadata,
      onProgress
    )
  }

  /**
   * Takes an array of [{metadataMultihash, metadataFileUUID}, {}, ]
   * Adds tracks to chain for this user
   * Associates tracks with user on creatorNode
   */
  static async registerUploadedTracks(uploadedTracks) {
    return audiusLibs.Track.addTracksToChainAndCnode(uploadedTracks)
  }

  static async uploadImage(file) {
    return audiusLibs.File.uploadImage(file)
  }

  static async updateTrack(trackId, metadata) {
    const cleanedMetadata = schemas.newTrackMetadata(metadata, true)

    if (metadata.artwork) {
      const resp = await audiusLibs.File.uploadImage(metadata.artwork.file)
      cleanedMetadata.cover_art_sizes = resp.dirCID
    }
    return await audiusLibs.Track.updateTrack(cleanedMetadata)
  }

  static async getCreators(ids) {
    try {
      if (ids.length === 0) return []
      const creators = await withEagerOption(
        {
          normal: libs => libs.User.getUsers,
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
        creators.map(async creator => AudiusBackend.getUserImages(creator))
      )
    } catch (err) {
      console.error(err.message)
      return []
    }
  }

  static async getCreatorSocialHandle(handle) {
    try {
      const res = await fetch(
        `${IDENTITY_SERVICE}/social_handles?handle=${handle}`
      ).then(res => res.json())
      return res
    } catch (e) {
      console.error(e)
      return {}
    }
  }

  /**
   * Retrieves the user's eth associated wallets from IPFS using the user's metadata CID and creator node endpoints
   * @param {User} user The user metadata which contains the CID for the metadata multihash
   * @returns Object The associated wallets mapping of address to nested signature
   */
  static async fetchUserAssociatedEthWallets(user) {
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
   * @param {User} user The user metadata which contains the CID for the metadata multihash
   * @returns Object The associated wallets mapping of address to nested signature
   */
  static async fetchUserAssociatedSolWallets(user) {
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
   * @param {User} user The user metadata which contains the CID for the metadata multihash
   * @returns Object The associated wallets mapping of address to nested signature
   */
  static async fetchUserAssociatedWallets(user) {
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

  static async updateCreator(metadata, id) {
    let newMetadata = { ...metadata }
    const associatedWallets = await AudiusBackend.fetchUserAssociatedWallets(
      metadata
    )
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
        newMetadata.twitter_handle ||
        newMetadata.instagram_handle ||
        newMetadata.tiktok_handle ||
        newMetadata.website ||
        newMetadata.donation
      ) {
        const { data, signature } = await AudiusBackend.signData()
        await fetch(`${IDENTITY_SERVICE}/social_handles`, {
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

      const {
        blockHash,
        blockNumber,
        userId
      } = await audiusLibs.User.updateCreator(newMetadata.user_id, newMetadata)
      return { blockHash, blockNumber, userId }
    } catch (err) {
      console.error(err.message)
      return false
    }
  }

  static async updateUser(metadata, id) {
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
        newMetadata.twitter_handle ||
        newMetadata.instagram_handle ||
        newMetadata.website ||
        newMetadata.donation
      ) {
        await fetch(`${IDENTITY_SERVICE}/social_handles`, {
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
      console.error(err.message)
      throw err
    }
  }

  static async updateIsVerified(userId, verified) {
    try {
      await audiusLibs.User.updateIsVerified(userId, verified)
      return true
    } catch (err) {
      console.error(err.message)
      return false
    }
  }

  static async followUser(followeeUserId) {
    try {
      return await audiusLibs.User.addUserFollow(followeeUserId)
    } catch (err) {
      console.error(err.message)
      throw err
    }
  }

  static async unfollowUser(followeeUserId) {
    try {
      return await audiusLibs.User.deleteUserFollow(followeeUserId)
    } catch (err) {
      console.error(err.message)
      throw err
    }
  }

  static async getFolloweeFollows(userId, limit = 100, offset = 0) {
    let followers = []
    try {
      followers = await audiusLibs.User.getMutualFollowers(
        limit,
        offset,
        userId
      )

      if (followers.length) {
        return Promise.all(
          followers.map(follower => AudiusBackend.getUserImages(follower))
        )
      }
    } catch (err) {
      console.error(err.message)
    }

    return followers
  }

  static async getPlaylists(userId, playlistIds) {
    try {
      const playlists = await withEagerOption(
        {
          normal: libs => libs.Playlist.getPlaylists,
          eager: DiscoveryAPI.getPlaylists
        },
        100,
        0,
        playlistIds,
        userId,
        true
      )
      return (playlists || []).map(AudiusBackend.getCollectionImages)
    } catch (err) {
      console.error(err.message)
      return []
    }
  }

  static async createPlaylist(
    userId,
    metadata,
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
      const response = await audiusLibs.Playlist.createPlaylist(
        userId,
        playlistName,
        isPrivate,
        isAlbum,
        trackIds
      )
      let { blockHash, blockNumber, playlistId, error } = response

      if (error) return { playlistId, error }

      const updatePromises = []

      // If this playlist is being created from an existing cover art, use it.
      if (metadata.cover_art_sizes) {
        updatePromises.push(
          audiusLibs.contracts.PlaylistFactoryClient.updatePlaylistCoverPhoto(
            playlistId,
            Utils.formatOptionalMultihash(metadata.cover_art_sizes)
          )
        )
      } else if (coverArt) {
        updatePromises.push(
          audiusLibs.Playlist.updatePlaylistCoverPhoto(playlistId, coverArt)
        )
      }
      if (description) {
        updatePromises.push(
          audiusLibs.Playlist.updatePlaylistDescription(playlistId, description)
        )
      }

      /**
       * find the latest transaction i.e. latest block number among the return transaction receipts
       * and return that block number along with its corresponding block hash
       */
      if (updatePromises.length > 0) {
        const latestReceipt = AudiusBackend.getLatestTxReceipt(
          await Promise.all(updatePromises)
        )
        blockHash = latestReceipt.blockHash
        blockNumber = latestReceipt.blockNumber
      }

      return { blockHash, blockNumber, playlistId }
    } catch (err) {
      // This code path should never execute
      console.debug('Reached client createPlaylist catch block')
      console.error(err.message)
      return { playlistId: null, error: true }
    }
  }

  static async updatePlaylist(playlistId, metadata) {
    const playlistName = metadata.playlist_name
    const coverPhoto = metadata.artwork.file
    const description = metadata.description

    try {
      let blockHash, blockNumber
      const promises = []
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
          audiusLibs.Playlist.updatePlaylistDescription(playlistId, description)
        )
      }

      /**
       * find the latest transaction i.e. latest block number among the return transaction receipts
       * and return that block number along with its corresponding block hash
       */
      if (promises.length > 0) {
        const latestReceipt = AudiusBackend.getLatestTxReceipt(
          await Promise.all(promises)
        )
        blockHash = latestReceipt.blockHash
        blockNumber = latestReceipt.blockNumber
      }

      return { blockHash, blockNumber }
    } catch (error) {
      console.error(error.message)
      return { error }
    }
  }

  static async orderPlaylist(playlistId, trackIds, retries) {
    try {
      const {
        blockHash,
        blockNumber
      } = await audiusLibs.Playlist.orderPlaylistTracks(
        playlistId,
        trackIds,
        retries
      )
      return { blockHash, blockNumber }
    } catch (error) {
      console.error(error.message)
      return { error }
    }
  }

  static async publishPlaylist(playlistId) {
    try {
      const {
        blockHash,
        blockNumber
      } = await audiusLibs.Playlist.updatePlaylistPrivacy(playlistId, false)
      return { blockHash, blockNumber }
    } catch (error) {
      console.error(error.message)
      return { error }
    }
  }

  static async addPlaylistTrack(playlistId, trackId) {
    try {
      const {
        blockHash,
        blockNumber
      } = await audiusLibs.Playlist.addPlaylistTrack(playlistId, trackId)
      return { blockHash, blockNumber }
    } catch (error) {
      console.error(error.message)
      return { error }
    }
  }

  static async deletePlaylistTrack(playlistId, trackId, timestamp, retries) {
    try {
      const {
        blockHash,
        blockNumber
      } = await audiusLibs.Playlist.deletePlaylistTrack(
        playlistId,
        trackId,
        timestamp,
        retries
      )
      return { blockHash, blockNumber }
    } catch (error) {
      console.error(error.message)
      return { error }
    }
  }

  static async validateTracksInPlaylist(playlistId) {
    try {
      const {
        isValid,
        invalidTrackIds
      } = await audiusLibs.Playlist.validateTracksInPlaylist(playlistId)
      return { error: false, isValid, invalidTrackIds }
    } catch (error) {
      console.error(error.message)
      return { error }
    }
  }

  // NOTE: This is called to explicitly set a playlist track ids w/out running validation checks.
  // This should NOT be used to set the playlist order
  // It's added for the purpose of manually fixing broken playlists
  static async dangerouslySetPlaylistOrder(playlistId, trackIds) {
    try {
      await audiusLibs.contracts.PlaylistFactoryClient.orderPlaylistTracks(
        playlistId,
        trackIds
      )
      return { error: false }
    } catch (error) {
      console.error(error.message)
      return { error }
    }
  }

  static async deletePlaylist(playlistId) {
    try {
      const { txReceipt } = await audiusLibs.Playlist.deletePlaylist(playlistId)
      return {
        blockHash: txReceipt.blockHash,
        blockNumber: txReceipt.blockNumber
      }
    } catch (error) {
      console.error(error.message)
      return { error }
    }
  }

  static async deleteAlbum(playlistId, trackIds) {
    try {
      console.debug(
        `Deleting Album ${playlistId}, tracks: ${JSON.stringify(
          trackIds.map(t => t.track)
        )}`
      )
      const trackDeletionPromises = trackIds.map(t =>
        audiusLibs.Track.deleteTrack(t.track)
      )
      const playlistDeletionPromise = audiusLibs.Playlist.deletePlaylist(
        playlistId
      )
      const results = await Promise.all(
        trackDeletionPromises.concat(playlistDeletionPromise)
      )
      const deleteTrackReceipts = results.slice(0, -1).map(r => r.txReceipt)
      const deletePlaylistReceipt = results.slice(-1)[0].txReceipt

      const { blockHash, blockNumber } = AudiusBackend.getLatestTxReceipt(
        deleteTrackReceipts.concat(deletePlaylistReceipt)
      )
      return { blockHash, blockNumber }
    } catch (error) {
      console.error(error.message)
      return { error }
    }
  }

  static async getSavedPlaylists(limit = 100, offset = 0) {
    try {
      const saves = await withEagerOption(
        {
          normal: libs => libs.Playlist.getSavedPlaylists,
          eager: DiscoveryAPI.getSavedPlaylists
        },
        limit,
        offset
      )
      return saves.map(save => save.save_item_id)
    } catch (err) {
      console.error(err.message)
      return []
    }
  }

  static async getSavedAlbums(limit = 100, offset = 0) {
    try {
      const saves = await withEagerOption(
        {
          normal: libs => libs.Playlist.getSavedAlbums,
          eager: DiscoveryAPI.getSavedAlbums
        },
        limit,
        offset
      )
      return saves.map(save => save.save_item_id)
    } catch (err) {
      console.error(err.message)
      return []
    }
  }

  static async getSavedTracks(limit = 100, offset = 0) {
    try {
      return withEagerOption(
        {
          normal: libs => libs.Track.getSavedTracks,
          eager: DiscoveryAPI.getSavedTracks
        },
        limit,
        offset
      )
    } catch (err) {
      console.error(err.message)
      return []
    }
  }

  // Favoriting a track
  static async saveTrack(trackId) {
    try {
      return await audiusLibs.Track.addTrackSave(trackId)
    } catch (err) {
      console.error(err.message)
      throw err
    }
  }

  static async deleteTrack(trackId) {
    try {
      const { txReceipt } = await audiusLibs.Track.deleteTrack(trackId)
      return {
        blockHash: txReceipt.blockHash,
        blockNumber: txReceipt.blockNumber
      }
    } catch (err) {
      console.error(err.message)
      throw err
    }
  }

  // Favorite a playlist
  static async saveCollection(playlistId) {
    try {
      return await audiusLibs.Playlist.addPlaylistSave(playlistId)
    } catch (err) {
      console.error(err.message)
      throw err
    }
  }

  // Unfavoriting a track
  static async unsaveTrack(trackId) {
    try {
      return await audiusLibs.Track.deleteTrackSave(trackId)
    } catch (err) {
      console.error(err.message)
      throw err
    }
  }

  // Unfavorite a playlist
  static async unsaveCollection(playlistId) {
    try {
      return await audiusLibs.Playlist.deletePlaylistSave(playlistId)
    } catch (err) {
      console.error(err.message)
      throw err
    }
  }

  /**
   * Sets the artist pick for a user
   * @param {number?} trackId if null, unsets the artist pick
   */
  static async setArtistPick(trackId = null) {
    await waitForLibsInit()
    const account = audiusLibs.Account.getCurrentUser()
    try {
      const { data, signature } = await AudiusBackend.signData()
      await fetch(`${IDENTITY_SERVICE}/artist_pick`, {
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
      console.error(err.message)
      return false
    }
  }

  static async signIn(email, password) {
    await waitForLibsInit()
    return audiusLibs.Account.login(email, password)
  }

  static async signOut() {
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
  static async signUp({
    email,
    password,
    formFields,
    hasWallet = false,
    referrer = null
  }) {
    await waitForLibsInit()
    const metadata = schemas.newUserMetadata()
    metadata.is_creator = false
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

    const hasEvents = referrer || NATIVE_MOBILE
    if (hasEvents) {
      metadata.events = {}
    }
    if (referrer) {
      metadata.events.referrer = referrer
    }
    if (NATIVE_MOBILE) {
      metadata.events.is_mobile_user = true
      window.localStorage.setItem(IS_MOBILE_USER_KEY, 'true')
    }

    // Returns { userId, error, phase }
    return audiusLibs.Account.signUp(
      email,
      password,
      metadata,
      formFields.profilePicture,
      formFields.coverPhoto,
      hasWallet,
      AudiusBackend._getHostUrl(),
      getFeatureEnabled(FeatureFlags.CREATE_WAUDIO_USER_BANK_ON_SIGN_UP)
    )
  }

  static async resetPassword(email, password) {
    await waitForLibsInit()
    return audiusLibs.Account.resetPassword(email, password)
  }

  static async changePassword(email, password, oldpassword) {
    await waitForLibsInit()
    return audiusLibs.Account.changePassword(email, password, oldpassword)
  }

  static async confirmCredentials(email, password) {
    await waitForLibsInit()
    return audiusLibs.Account.confirmCredentials(email, password)
  }

  static async sendRecoveryEmail() {
    await waitForLibsInit()
    const host = AudiusBackend._getHostUrl()
    return audiusLibs.Account.generateRecoveryLink({ host })
  }

  static _getHostUrl() {
    return NATIVE_MOBILE && process.env.REACT_APP_ENVIRONMENT === 'production'
      ? AUDIUS_ORIGIN
      : window.location.origin
  }

  static async associateAudiusUserForAuth(email, handle) {
    await waitForLibsInit()
    try {
      await audiusLibs.Account.associateAudiusUserForAuth(email, handle)
      return { success: true }
    } catch (error) {
      console.error(error.message)
      return { success: false, error }
    }
  }

  static async emailInUse(email) {
    await waitForLibsInit()
    try {
      const {
        exists: emailExists
      } = await audiusLibs.Account.checkIfEmailRegistered(email)
      return emailExists
    } catch (error) {
      console.error(error.message)
      return true
    }
  }

  static async handleInUse(handle) {
    await waitForLibsInit()
    try {
      const handleIsValid = await audiusLibs.Account.handleIsValid(handle)
      return !handleIsValid
    } catch (error) {
      return true
    }
  }

  static async twitterHandle(handle) {
    await waitForLibsInit()
    try {
      const user = await audiusLibs.Account.lookupTwitterHandle(handle)
      return { success: true, user }
    } catch (error) {
      return { success: false, error }
    }
  }

  static async associateTwitterAccount(twitterId, userId, handle) {
    await waitForLibsInit()
    try {
      await audiusLibs.Account.associateTwitterUser(twitterId, userId, handle)
      return { success: true }
    } catch (error) {
      console.error(error.message)
      return { success: false, error }
    }
  }

  static async associateInstagramAccount(instagramId, userId, handle) {
    await waitForLibsInit()
    try {
      await audiusLibs.Account.associateInstagramUser(
        instagramId,
        userId,
        handle
      )
      return { success: true }
    } catch (error) {
      console.error(error.message)
      return { success: false, error }
    }
  }

  static async getNotifications(limit, timeOffset) {
    await waitForLibsInit()
    const account = audiusLibs.Account.getCurrentUser()
    if (!account) return
    try {
      const { data, signature } = await AudiusBackend.signData()
      const timeOffsetQuery = timeOffset
        ? `&timeOffset=${encodeURI(timeOffset)}`
        : ''
      const limitQuery = `&limit=${limit}`
      const handleQuery = `&handle=${account.handle}`
      const notifications = await fetch(
        `${IDENTITY_SERVICE}/notifications?${limitQuery}${timeOffsetQuery}${handleQuery}&withRemix=true&withTrendingTrack=true`,
        {
          headers: {
            'Content-Type': 'application/json',
            [AuthHeaders.Message]: data,
            [AuthHeaders.Signature]: signature
          }
        }
      ).then(res => {
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

  static async markNotificationAsRead(notificationId, notificationType) {
    await waitForLibsInit()
    const account = audiusLibs.Account.getCurrentUser()
    if (!account) return
    try {
      const { data, signature } = await AudiusBackend.signData()
      return fetch(`${IDENTITY_SERVICE}/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [AuthHeaders.Message]: data,
          [AuthHeaders.Signature]: signature
        },
        body: JSON.stringify({
          notificationId,
          notificationType,
          isRead: true
        })
      }).then(res => res.json())
    } catch (e) {
      console.error(e)
    }
  }

  static async markAllNotificationAsRead() {
    await waitForLibsInit()
    const account = audiusLibs.Account.getCurrentUser()
    if (!account) return
    try {
      const { data, signature } = await AudiusBackend.signData()
      return fetch(`${IDENTITY_SERVICE}/notifications/all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [AuthHeaders.Message]: data,
          [AuthHeaders.Signature]: signature
        },
        body: JSON.stringify({ isRead: true })
      }).then(res => res.json())
    } catch (e) {
      console.error(e)
    }
  }

  static async markAllNotificationAsViewed() {
    await waitForLibsInit()
    const account = audiusLibs.Account.getCurrentUser()
    if (!account) return
    try {
      const { data, signature } = await AudiusBackend.signData()
      return fetch(`${IDENTITY_SERVICE}/notifications/all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [AuthHeaders.Message]: data,
          [AuthHeaders.Signature]: signature
        },
        body: JSON.stringify({ isViewed: true, clearBadges: !!NATIVE_MOBILE })
      }).then(res => res.json())
    } catch (e) {
      console.error(e)
    }
  }

  static async clearNotificationBadges() {
    await waitForLibsInit()
    const account = audiusLibs.Account.getCurrentUser()
    if (!account) return
    try {
      const { data, signature } = await AudiusBackend.signData()
      return fetch(`${IDENTITY_SERVICE}/notifications/clear_badges`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [AuthHeaders.Message]: data,
          [AuthHeaders.Signature]: signature
        }
      }).then(res => res.json())
    } catch (e) {
      console.error(e)
    }
  }

  static async getEmailNotificationSettings() {
    await waitForLibsInit()
    const account = audiusLibs.Account.getCurrentUser()
    if (!account) return
    try {
      const { data, signature } = await AudiusBackend.signData()
      const res = await fetch(`${IDENTITY_SERVICE}/notifications/settings`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          [AuthHeaders.Message]: data,
          [AuthHeaders.Signature]: signature
        }
      }).then(res => res.json())
      return res
    } catch (e) {
      console.error(e)
    }
  }

  static async updateEmailNotificationSettings(emailFrequency) {
    await waitForLibsInit()
    const account = audiusLibs.Account.getCurrentUser()
    if (!account) return
    try {
      const { data, signature } = await AudiusBackend.signData()
      const res = await fetch(`${IDENTITY_SERVICE}/notifications/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [AuthHeaders.Message]: data,
          [AuthHeaders.Signature]: signature
        },
        body: JSON.stringify({ settings: { emailFrequency } })
      }).then(res => res.json())
      return res
    } catch (e) {
      console.error(e)
    }
  }

  static async markNotificationAsHidden(notificationId, notificationType) {
    await waitForLibsInit()
    const account = audiusLibs.Account.getCurrentUser()
    if (!account) return
    try {
      const { data, signature } = await AudiusBackend.signData()
      return fetch(`${IDENTITY_SERVICE}/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [AuthHeaders.Message]: data,
          [AuthHeaders.Signature]: signature
        },
        body: JSON.stringify({
          notificationId,
          notificationType,
          isHidden: true
        })
      }).then(res => res.json())
    } catch (e) {
      console.error(e)
    }
  }

  static async updateNotificationSettings(settings) {
    await waitForLibsInit()
    const account = audiusLibs.Account.getCurrentUser()
    if (!account) return
    try {
      const { data, signature } = await AudiusBackend.signData()
      return fetch(`${IDENTITY_SERVICE}/push_notifications/browser/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [AuthHeaders.Message]: data,
          [AuthHeaders.Signature]: signature
        },
        body: JSON.stringify({ settings })
      }).then(res => res.json())
    } catch (e) {
      console.error(e)
    }
  }

  static async updatePushNotificationSettings(settings) {
    await waitForLibsInit()
    const account = audiusLibs.Account.getCurrentUser()
    if (!account) return
    try {
      const { data, signature } = await AudiusBackend.signData()
      return fetch(`${IDENTITY_SERVICE}/push_notifications/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [AuthHeaders.Message]: data,
          [AuthHeaders.Signature]: signature
        },
        body: JSON.stringify({ settings })
      }).then(res => res.json())
    } catch (e) {
      console.error(e)
    }
  }

  static async getCognitoSignature() {
    await waitForLibsInit()
    const account = audiusLibs.Account.getCurrentUser()
    if (!account) return
    try {
      const { data, signature } = await AudiusBackend.signData()
      const response = await fetch(`${IDENTITY_SERVICE}/cognito_signature`, {
        headers: {
          'Content-Type': 'application/json',
          [AuthHeaders.Message]: data,
          [AuthHeaders.Signature]: signature
        }
      }).then(res => res.json())
      return response
    } catch (e) {
      console.error(e)
      return {}
    }
  }

  static async signData() {
    const unixTs = Math.round(new Date().getTime() / 1000) // current unix timestamp (sec)
    const data = `Click sign to authenticate with identity service: ${unixTs}`
    const signature = await audiusLibs.Account.web3Manager.sign(data)
    return { data, signature }
  }

  static async getBrowserPushNotificationSettings() {
    await waitForLibsInit()
    const account = audiusLibs.Account.getCurrentUser()
    if (!account) return
    try {
      const { data, signature } = await AudiusBackend.signData()
      return fetch(`${IDENTITY_SERVICE}/push_notifications/browser/settings`, {
        headers: {
          [AuthHeaders.Message]: data,
          [AuthHeaders.Signature]: signature
        }
      })
        .then(res => res.json())
        .then(res => res.settings)
    } catch (e) {
      console.error(e)
      return null
    }
  }

  static async getBrowserPushSubscription(pushEndpoint) {
    await waitForLibsInit()
    const account = audiusLibs.Account.getCurrentUser()
    if (!account) return
    try {
      const { data, signature } = await AudiusBackend.signData()
      const endpiont = encodeURIComponent(pushEndpoint)
      return fetch(
        `${IDENTITY_SERVICE}/push_notifications/browser/enabled?endpoint=${endpiont}`,
        {
          headers: {
            [AuthHeaders.Message]: data,
            [AuthHeaders.Signature]: signature
          }
        }
      )
        .then(res => res.json())
        .then(res => res.enabled)
    } catch (e) {
      console.error(e)
      return null
    }
  }

  static async getSafariBrowserPushEnabled(deviceToken) {
    await waitForLibsInit()
    const account = audiusLibs.Account.getCurrentUser()
    if (!account) return
    try {
      const { data, signature } = await AudiusBackend.signData()
      return fetch(
        `${IDENTITY_SERVICE}/push_notifications/device_token/enabled?deviceToken=${deviceToken}&deviceType=safari`,
        {
          headers: {
            [AuthHeaders.Message]: data,
            [AuthHeaders.Signature]: signature
          }
        }
      )
        .then(res => res.json())
        .then(res => res.enabled)
    } catch (e) {
      console.error(e)
      return null
    }
  }

  static async updateBrowserNotifications({ enabled = true, subscription }) {
    await waitForLibsInit()
    const { data, signature } = await AudiusBackend.signData()
    return fetch(`${IDENTITY_SERVICE}/push_notifications/browser/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [AuthHeaders.Message]: data,
        [AuthHeaders.Signature]: signature
      },
      body: JSON.stringify({ enabled, subscription })
    }).then(res => res.json())
  }

  static async disableBrowserNotifications({ subscription }) {
    await waitForLibsInit()
    const { data, signature } = await AudiusBackend.signData()
    return fetch(`${IDENTITY_SERVICE}/push_notifications/browser/deregister`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [AuthHeaders.Message]: data,
        [AuthHeaders.Signature]: signature
      },
      body: JSON.stringify({ subscription })
    }).then(res => res.json())
  }

  static async getPushNotificationSettings() {
    await waitForLibsInit()
    const account = audiusLibs.Account.getCurrentUser()
    if (!account) return
    try {
      const { data, signature } = await AudiusBackend.signData()
      return fetch(`${IDENTITY_SERVICE}/push_notifications/settings`, {
        headers: {
          [AuthHeaders.Message]: data,
          [AuthHeaders.Signature]: signature
        }
      })
        .then(res => res.json())
        .then(res => res.settings)
    } catch (e) {
      console.error(e)
    }
  }

  static async registerDeviceToken(deviceToken, deviceType) {
    await waitForLibsInit()
    const account = audiusLibs.Account.getCurrentUser()
    if (!account) return
    try {
      const { data, signature } = await AudiusBackend.signData()
      return fetch(`${IDENTITY_SERVICE}/push_notifications/device_token`, {
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
      }).then(res => res.json())
    } catch (e) {
      console.error(e)
    }
  }

  static async deregisterDeviceToken(deviceToken) {
    await waitForLibsInit()
    const account = audiusLibs.Account.getCurrentUser()
    if (!account) return
    try {
      const { data, signature } = await AudiusBackend.signData()
      return fetch(
        `${IDENTITY_SERVICE}/push_notifications/device_token/deregister`,
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
      ).then(res => res.json())
    } catch (e) {
      console.error(e)
    }
  }

  static async getUserSubscribed(userId) {
    await waitForLibsInit()
    const account = audiusLibs.Account.getCurrentUser()
    if (!account) return
    try {
      const { data, signature } = await AudiusBackend.signData()
      return fetch(
        `${IDENTITY_SERVICE}/notifications/subscription?userId=${userId}`,
        {
          headers: {
            [AuthHeaders.Message]: data,
            [AuthHeaders.Signature]: signature
          }
        }
      )
        .then(res => res.json())
        .then(res =>
          res.users && res.users[userId.toString()]
            ? res.users[userId.toString()].isSubscribed
            : false
        )
    } catch (e) {
      console.error(e)
    }
  }

  static async getUserSubscriptions(userIds) {
    await waitForLibsInit()
    const account = audiusLibs.Account.getCurrentUser()
    if (!account) return
    try {
      const { data, signature } = await AudiusBackend.signData()
      return fetch(
        `${IDENTITY_SERVICE}/notifications/subscription?${userIds
          .map(id => `userId=${id}`)
          .join('&')}`,
        {
          headers: {
            [AuthHeaders.Message]: data,
            [AuthHeaders.Signature]: signature
          }
        }
      )
        .then(res => res.json())
        .then(res => res.users)
    } catch (e) {
      console.error(e)
    }
  }

  static async updateUserSubscription(userId, isSubscribed) {
    await waitForLibsInit()
    const account = audiusLibs.Account.getCurrentUser()
    if (!account) return
    try {
      const { data, signature } = await AudiusBackend.signData()
      return fetch(`${IDENTITY_SERVICE}/notifications/subscription`, {
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
      }).then(res => res.json())
    } catch (e) {
      console.error(e)
    }
  }

  static async updateUserLocationTimezone() {
    await waitForLibsInit()
    const account = audiusLibs.Account.getCurrentUser()
    if (!account) return
    try {
      const { data, signature } = await AudiusBackend.signData()
      const timezone = moment.tz.guess()
      const res = await fetch(`${IDENTITY_SERVICE}/users/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [AuthHeaders.Message]: data,
          [AuthHeaders.Signature]: signature
        },
        body: JSON.stringify({ timezone })
      }).then(res => res.json())
      return res
    } catch (e) {
      console.error(e)
    }
  }

  static async sendWelcomeEmail({ name }) {
    await waitForLibsInit()
    const account = audiusLibs.Account.getCurrentUser()
    if (!account) return
    try {
      const { data, signature } = await AudiusBackend.signData()
      return fetch(`${IDENTITY_SERVICE}/email/welcome`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [AuthHeaders.Message]: data,
          [AuthHeaders.Signature]: signature
        },
        body: JSON.stringify({ name, isNativeMobile: !!NATIVE_MOBILE })
      }).then(res => res.json())
    } catch (e) {
      console.error(e)
    }
  }

  static async updateUserEvent({ hasSignedInNativeMobile }) {
    await waitForLibsInit()
    const account = audiusLibs.Account.getCurrentUser()
    if (!account) return
    try {
      const { data, signature } = await AudiusBackend.signData()
      const res = await fetch(`${IDENTITY_SERVICE}/userEvents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [AuthHeaders.Message]: data,
          [AuthHeaders.Signature]: signature
        },
        body: JSON.stringify({ hasSignedInNativeMobile })
      }).then(res => res.json())
      return res
    } catch (e) {
      console.error(e)
    }
  }

  /**
   * Sets the playlist as viewed to reset the playlist updates notifications timer
   * @param {playlistId} playlistId playlist id or folder id
   */
  static async updatePlaylistLastViewedAt(playlistId) {
    if (!getFeatureEnabled(FeatureFlags.PLAYLIST_UPDATES_ENABLED)) return

    await waitForLibsInit()
    const account = audiusLibs.Account.getCurrentUser()
    if (!account) return

    try {
      const { data, signature } = await AudiusBackend.signData()
      await fetch(
        `${IDENTITY_SERVICE}/user_playlist_updates?walletAddress=${account.wallet}&playlistId=${playlistId}`,
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
      console.error(err.message)
      return false
    }
  }

  static async updateHCaptchaScore(token) {
    await waitForLibsInit()
    const account = audiusLibs.Account.getCurrentUser()
    if (!account) return { error: true }

    try {
      const { data, signature } = await AudiusBackend.signData()
      return await fetch(`${IDENTITY_SERVICE}/score/hcaptcha`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [AuthHeaders.Message]: data,
          [AuthHeaders.Signature]: signature
        },
        body: JSON.stringify({ token })
      }).then(res => res.json())
    } catch (err) {
      console.error(err.message)
      return { error: true }
    }
  }

  /**
   * Retrieves the claim distribution amount
   * @returns {BN} amount The claim amount
   */
  static async getClaimDistributionAmount() {
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
  static async makeDistributionClaim() {
    await waitForLibsInit()
    const wallet = audiusLibs.web3Manager.getWalletAddress()
    if (!wallet) return null

    await audiusLibs.Account.makeDistributionClaim()
  }

  /**
   * Make a request to check if the user has already claimed
   * @returns {Promise<boolean>} doesHaveClaim
   */
  static async getHasClaimed() {
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
   * Make a request to fetch the balance of the the user
   * @params {bool} bustCache
   * @returns {Promise<BN>} balance
   */
  static async getBalance(bustCache = false) {
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
   * Make a request to fetch the balance, staked and delegated total of the wallet address
   * @params {string} address The wallet address to fetch the balance for
   * @params {bool} bustCache
   * @returns {Promise<BN>} balance
   */
  static async getAddressTotalStakedBalance(address, bustCache = false) {
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
      const delegatedBalance = await audiusLibs.ethContracts.DelegateManagerClient.getTotalDelegatorStake(
        checksumWallet
      )
      const stakedBalance = await audiusLibs.ethContracts.StakingProxyClient.totalStakedFor(
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
  static async sendTokens(address, amount) {
    await waitForLibsInit()
    const receipt = await audiusLibs.Account.permitAndSendTokens(
      address,
      amount
    )
    return receipt
  }

  static async getSignature(data) {
    await waitForLibsInit()
    return audiusLibs.web3Manager.sign(data)
  }

  /**
   * Get latest transaction receipt based on block number
   * Used by confirmer
   */

  static getLatestTxReceipt(receipts) {
    if (!receipts.length) return {}
    return receipts.sort((receipt1, receipt2) =>
      receipt1.blockNumber < receipt2.blockNumber ? 1 : -1
    )[0]
  }

  /**
   * Transfers the user's ERC20 AUDIO into SPL WAUDIO to their solana user bank account
   * @param {BN} balance The amount of AUDIO to be transferred
   */
  static async transferAudioToWAudio(balance) {
    await waitForLibsInit()
    const userBank = await audiusLibs.solanaWeb3Manager.getUserBank()
    await audiusLibs.Account.permitAndSendTokensViaWormhole(
      balance,
      userBank.toString()
    )
  }

  /**
   * Fetches the SPL WAUDIO balance for the user's solana wallet address
   * @param {string} The solana wallet address
   */
  static async getAddressWAudioBalance(address) {
    await waitForLibsInit()
    const waudioBalance = await audiusLibs.solanaWeb3Manager.getWAudioBalance(
      address
    )
    return waudioBalance ?? new BN('0')
  }

  /**
   * Aggregate, submit, and evaluate attestations for a given challenge for a user
   */
  static async submitAndEvaluateAttestations({
    challengeId,
    encodedUserId,
    handle,
    recipientEthAddress,
    specifier,
    oracleEthAddress,
    amount,
    quorumSize,
    AAOEndpoint
  }) {
    await waitForLibsInit()
    try {
      const res = await audiusLibs.Challenge.submitAndEvaluate({
        challengeId,
        encodedUserId,
        handle,
        recipientEthAddress,
        specifier,
        oracleEthAddress,
        amount,
        quorumSize,
        AAOEndpoint
      })
      return res
    } catch (e) {
      console.log(`Failed in libs call to claim reward`)
      console.error(e)
      return { error: true }
    }
  }
}

export default AudiusBackend
