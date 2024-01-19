import { ID, encodeUrlName, getHash } from '@audius/common'
import { push as pushRoute } from 'connected-react-router'
import { Location as HistoryLocation } from 'history'
import { matchPath } from 'react-router'

import { env } from 'services/env'

const USE_HASH_ROUTING = env.USE_HASH_ROUTING

// Host/protocol.
export const BASE_URL = `${env.PUBLIC_PROTOCOL || 'https:'}//${
  env.PUBLIC_HOSTNAME || 'audius.co'
}`
export const BASE_GA_URL = `${env.PUBLIC_PROTOCOL || 'https:'}//${
  env.GA_HOSTNAME || 'audius.co'
}`
export const BASENAME = env.PUBLIC_URL

// External Routes
export const PRIVACY_POLICY = '/legal/privacy-policy'
export const COOKIE_POLICY = `${BASE_URL}${PRIVACY_POLICY}`
export const TERMS_OF_SERVICE = '/legal/terms-of-use'
export const DOWNLOAD_START_LINK = '/download?start_download=true'
export const DOWNLOAD_LINK = '/download'
export const PRESS_PAGE = '/press'
export const AUTH_REDIRECT = '/auth-redirect'

// App Routes
export const ANDROID_PLAY_STORE_LINK =
  'https://play.google.com/store/apps/details?id=co.audius.app'
export const IOS_WEBSITE_STORE_LINK =
  'https://apps.apple.com/us/app/audius-music/id1491270519'
export const IOS_APP_STORE_LINK = 'itms-apps://us/app/audius-music/id1491270519'

// Static routes.
export const FEED_PAGE = '/feed'
export const TRENDING_PAGE = '/trending'
export const TRENDING_PLAYLISTS_PAGE_LEGACY = '/trending/playlists'

export const EXPLORE_PAGE = '/explore'
export const EXPLORE_PREMIUM_TRACKS_PAGE = '/explore/premium-tracks'
export const EXPLORE_HEAVY_ROTATION_PAGE = '/explore/heavy-rotation'
export const EXPLORE_LET_THEM_DJ_PAGE = '/explore/let-them-dj'
export const EXPLORE_BEST_NEW_RELEASES_PAGE = '/explore/best-new-releases'
export const EXPLORE_UNDER_THE_RADAR_PAGE = '/explore/under-the-radar'
export const EXPLORE_TOP_ALBUMS_PAGE = '/explore/top-albums'
export const EXPLORE_MOST_LOVED_PAGE = '/explore/most-loved'
export const EXPLORE_FEELING_LUCKY_PAGE = '/explore/feeling-lucky'
export const EXPLORE_MOOD_PLAYLISTS_PAGE = '/explore/:mood'
export const TRENDING_PLAYLISTS_PAGE = '/explore/playlists'
export const TRENDING_UNDERGROUND_PAGE = '/explore/underground'
export const EXPLORE_REMIXABLES_PAGE = '/explore/remixables'

export const AUDIO_NFT_PLAYLIST_PAGE = '/:handle/audio-nft-playlist'

// DEPRECATED - use /library instead.
export const SAVED_PAGE = '/favorites'
export const FAVORITES_PAGE = '/favorites'

export const LIBRARY_PAGE = '/library'
export const HISTORY_PAGE = '/history'
export const DASHBOARD_PAGE = '/dashboard'
export const AUDIO_PAGE = '/audio'
export const AUDIO_TRANSACTIONS_PAGE = '/audio/transactions'
export const UPLOAD_PAGE = '/upload'
export const UPLOAD_ALBUM_PAGE = '/upload/album'
export const UPLOAD_PLAYLIST_PAGE = '/upload/playlist'
export const SETTINGS_PAGE = '/settings'
export const HOME_PAGE = '/'
export const NOT_FOUND_PAGE = '/404'
export const SIGN_IN_PAGE = '/signin'
export const SIGN_UP_PAGE = '/signup'
export const SIGN_ON_ALIASES = Object.freeze([
  '/login',
  '/join',
  '/signon',
  '/register'
])
export const OAUTH_LOGIN_PAGE = '/oauth/auth'
export const NOTIFICATION_PAGE = '/notifications'
export const APP_REDIRECT = '/app-redirect'
export const CHECK_PAGE = '/check'
export const DEACTIVATE_PAGE = '/deactivate'
export const CHATS_PAGE = '/messages'
export const CHAT_PAGE = '/messages/:id?'
export const PAYMENTS_PAGE = '/payments'
export const PURCHASES_PAGE = '/payments/purchases'
export const SALES_PAGE = '/payments/sales'
export const WITHDRAWALS_PAGE = '/payments/withdrawals'

// Multi-stage sign up flow routes
export enum SignUpPath {
  createEmail = 'create-email',
  createPassword = 'create-password',
  createLoginDetails = 'create-login-details',
  pickHandle = 'pick-handle',
  reviewHandle = 'review-handle',
  finishProfile = 'finish-profile',
  selectGenres = 'select-genres',
  selectArtists = 'select-artists',
  loading = 'loading',
  appCta = 'app-cta',
  completedRedirect = 'completed'
}
export const SIGN_UP_EMAIL_PAGE = `/signup/${SignUpPath.createEmail}`
export const SIGN_UP_START_PAGE = SIGN_UP_EMAIL_PAGE // entry point for sign up if needing to redirect to the beginning
export const SIGN_UP_PASSWORD_PAGE = `/signup/${SignUpPath.createPassword}`
export const SIGN_UP_CREATE_LOGIN_DETAILS = `/signup/${SignUpPath.createLoginDetails}`
export const SIGN_UP_HANDLE_PAGE = `/signup/${SignUpPath.pickHandle}`
export const SIGN_UP_REVIEW_HANDLE_PAGE = `/signup/${SignUpPath.reviewHandle}`
export const SIGN_UP_FINISH_PROFILE_PAGE = `/signup/${SignUpPath.finishProfile}`
export const SIGN_UP_GENRES_PAGE = `/signup/${SignUpPath.selectGenres}`
export const SIGN_UP_ARTISTS_PAGE = `/signup/${SignUpPath.selectArtists}`
export const SIGN_UP_APP_CTA_PAGE = `/signup/${SignUpPath.appCta}`
export const SIGN_UP_LOADING_PAGE = `/signup/${SignUpPath.loading}`
export const SIGN_UP_COMPLETED_REDIRECT = `/signup/${SignUpPath.completedRedirect}`

// Param routes.
export const NOTIFICATION_USERS_PAGE = '/notification/:notificationId/users'
export const SEARCH_CATEGORY_PAGE = '/search/:query/:category'
export const SEARCH_PAGE = '/search/:query?'
export const PLAYLIST_PAGE = '/:handle/playlist/:playlistName'
export const PLAYLIST_BY_PERMALINK_PAGE = '/:handle/playlist/:slug'
export const ALBUM_BY_PERMALINK_PAGE = '/:handle/album/:slug'
export const ALBUM_PAGE = '/:handle/album/:albumName'
export const TRACK_PAGE = '/:handle/:slug'
export const TRACK_REMIXES_PAGE = '/:handle/:slug/remixes'
export const PROFILE_PAGE = '/:handle'
export const PROFILE_PAGE_TRACKS = '/:handle/tracks'
export const PROFILE_PAGE_ALBUMS = '/:handle/albums'
export const PROFILE_PAGE_PLAYLISTS = '/:handle/playlists'
export const PROFILE_PAGE_REPOSTS = '/:handle/reposts'
export const PROFILE_PAGE_COLLECTIBLES = '/:handle/collectibles'
export const PROFILE_PAGE_COLLECTIBLE_DETAILS =
  '/:handle/collectibles/:collectibleId'
export const PROFILE_PAGE_AI_ATTRIBUTED_TRACKS = '/:handle/ai'
// Opaque id routes
export const TRACK_ID_PAGE = '/tracks/:id'
export const USER_ID_PAGE = '/users/:id'
export const PLAYLIST_ID_PAGE = '/playlists/:id'

// Mobile Only Routes
export const REPOSTING_USERS_ROUTE = '/reposting_users'
export const FAVORITING_USERS_ROUTE = '/favoriting_users'
export const FOLLOWING_USERS_ROUTE = '/following'
export const FOLLOWERS_USERS_ROUTE = '/followers'
export const SUPPORTING_USERS_ROUTE = '/supporting'
export const TOP_SUPPORTERS_USERS_ROUTE = '/top-supporters'
export const ACCOUNT_SETTINGS_PAGE = '/settings/account'
export const ACCOUNT_VERIFICATION_SETTINGS_PAGE =
  '/settings/account/verification'
export const NOTIFICATION_SETTINGS_PAGE = '/settings/notifications'
export const ABOUT_SETTINGS_PAGE = '/settings/about'
export const CHANGE_PASSWORD_SETTINGS_PAGE = '/settings/change-password'
export const TRENDING_GENRES = '/trending/genres'
export const EMPTY_PAGE = '/empty_page'

// External Links
export const AUDIUS_TWITTER_LINK = 'https://twitter.com/audius'
export const AUDIUS_INSTAGRAM_LINK = 'https://www.instagram.com/audiusmusic'
export const AUDIUS_DISCORD_LINK = 'https://discord.gg/audius'
export const AUDIUS_TELEGRAM_LINK = 'https://t.me/Audius'
export const AUDIUS_PRESS_LINK = 'https://brand.audius.co'
export const AUDIUS_MERCH_LINK = 'https://merch.audius.co/'
export const AUDIUS_REMIX_CONTESTS_LINK = 'https://remix.audius.co/'
export const AUDIUS_BLOG_LINK = 'https://blog.audius.co/'
export const AUDIUS_AI_BLOG_LINK =
  'https://help.audius.co/help/What-should-I-know-about-AI-generated-music-on-Audius-0a5a8'
export const AUDIUS_GATED_CONTENT_BLOG_LINK =
  'https://blog.audius.co/article/introducing-nft-collectible-gated-content'
export const AUDIUS_CONTACT_EMAIL_LINK = 'mailto:contact@audius.co'

export const externalInternalLinks = [
  AUDIUS_PRESS_LINK,
  AUDIUS_MERCH_LINK,
  AUDIUS_REMIX_CONTESTS_LINK,
  AUDIUS_BLOG_LINK,
  'https://help.audius.co'
]

// Org Links
export const AUDIUS_ORG = 'https://audius.org'
export const AUDIUS_DOCS_LINK = 'https://docs.audius.org'
export const AUDIUS_TEAM_LINK = 'https://audius.org/team'
export const AUDIUS_DEV_STAKER_LINK = 'https://audius.org/protocol'

export const AUDIUS_HOT_AND_NEW =
  '/audius/playlist/hot-new-on-audius-%F0%9F%94%A5-4281'
export const AUDIUS_HELP_LINK = 'https://help.audius.co/'

export const AUDIUS_CAREERS_LINK = 'https://jobs.lever.co/audius'
export const AUDIUS_PODCAST_LINK =
  'https://www.youtube.com/playlist?list=PLKEECkHRxmPag5iYp4dTK5fGoRcoX40RY'
export const AUDIUS_CYPHER_LINK = 'https://discord.gg/audius'
export const AUDIUS_API_LINK = 'https://audius.org/api'

export const authenticatedRoutes = [
  FEED_PAGE,
  SAVED_PAGE,
  LIBRARY_PAGE,
  HISTORY_PAGE,
  UPLOAD_PAGE,
  SETTINGS_PAGE,
  DEACTIVATE_PAGE,
  CHATS_PAGE,
  CHAT_PAGE,
  PURCHASES_PAGE,
  SALES_PAGE,
  WITHDRAWALS_PAGE
]

export const publicSiteRoutes = [
  PRESS_PAGE,
  TERMS_OF_SERVICE,
  PRIVACY_POLICY,
  DOWNLOAD_LINK,
  AUTH_REDIRECT
]

// ordered list of routes the App attempts to match in increasing order of route selectivity
export const orderedRoutes = [
  SIGN_IN_PAGE,
  SIGN_UP_PAGE,
  ...SIGN_ON_ALIASES,
  SIGN_UP_EMAIL_PAGE,
  SIGN_UP_PASSWORD_PAGE,
  SIGN_UP_HANDLE_PAGE,
  SIGN_UP_FINISH_PROFILE_PAGE,
  SIGN_UP_GENRES_PAGE,
  SIGN_UP_ARTISTS_PAGE,
  FEED_PAGE,
  NOTIFICATION_USERS_PAGE,
  NOTIFICATION_PAGE,
  TRENDING_GENRES,
  TRENDING_PAGE,
  EXPLORE_PAGE,
  EMPTY_PAGE,
  SEARCH_CATEGORY_PAGE,
  SEARCH_PAGE,
  UPLOAD_ALBUM_PAGE,
  UPLOAD_PLAYLIST_PAGE,
  UPLOAD_PAGE,
  SAVED_PAGE,
  LIBRARY_PAGE,
  HISTORY_PAGE,
  DASHBOARD_PAGE,
  PAYMENTS_PAGE,
  AUDIO_PAGE,
  AUDIO_TRANSACTIONS_PAGE,
  SETTINGS_PAGE,
  ACCOUNT_SETTINGS_PAGE,
  NOTIFICATION_SETTINGS_PAGE,
  ABOUT_SETTINGS_PAGE,
  PURCHASES_PAGE,
  SALES_PAGE,
  WITHDRAWALS_PAGE,
  NOT_FOUND_PAGE,
  HOME_PAGE,
  PLAYLIST_PAGE,
  ALBUM_PAGE,
  TRACK_PAGE,
  REPOSTING_USERS_ROUTE,
  FAVORITING_USERS_ROUTE,
  FOLLOWING_USERS_ROUTE,
  FOLLOWERS_USERS_ROUTE,
  SUPPORTING_USERS_ROUTE,
  TOP_SUPPORTERS_USERS_ROUTE,
  PROFILE_PAGE,
  PROFILE_PAGE_COLLECTIBLES,
  PROFILE_PAGE_COLLECTIBLE_DETAILS
]

export const staticRoutes = new Set([
  FEED_PAGE,
  TRENDING_PAGE,
  EXPLORE_PAGE,
  SAVED_PAGE,
  LIBRARY_PAGE,
  FAVORITES_PAGE,
  HISTORY_PAGE,
  DASHBOARD_PAGE,
  PAYMENTS_PAGE,
  AUDIO_PAGE,
  AUDIO_TRANSACTIONS_PAGE,
  UPLOAD_PAGE,
  UPLOAD_ALBUM_PAGE,
  UPLOAD_PLAYLIST_PAGE,
  SETTINGS_PAGE,
  HOME_PAGE,
  NOT_FOUND_PAGE,
  EMPTY_PAGE,
  SIGN_IN_PAGE,
  SIGN_UP_PAGE,
  NOTIFICATION_PAGE,
  APP_REDIRECT,
  REPOSTING_USERS_ROUTE,
  FAVORITING_USERS_ROUTE,
  FOLLOWING_USERS_ROUTE,
  FOLLOWERS_USERS_ROUTE,
  SUPPORTING_USERS_ROUTE,
  TOP_SUPPORTERS_USERS_ROUTE,
  ACCOUNT_SETTINGS_PAGE,
  NOTIFICATION_SETTINGS_PAGE,
  ABOUT_SETTINGS_PAGE,
  TRENDING_GENRES,
  PURCHASES_PAGE,
  SALES_PAGE,
  WITHDRAWALS_PAGE
])

/** Given a pathname, finds a matching route */
export const findRoute = (pathname: string) => {
  for (const route of orderedRoutes) {
    const match = matchPath(pathname, { path: route, exact: true })
    if (match) {
      return route
    }
  }
  return null
}

// Create full formed urls for routes.
export const fullTrackPage = (permalink: string) => {
  return `${BASE_URL}${permalink}`
}

export const trackRemixesPage = (permalink: string) => {
  return `${permalink}/remixes`
}
export const fullTrackRemixesPage = (permalink: string) => {
  return `${fullTrackPage(permalink)}/remixes`
}

export const fullAiPage = (handle: string) => {
  return `${fullProfilePage(handle)}/ai`
}

export const albumPage = (handle: string, title: string, id: ID) => {
  return `/${encodeUrlName(handle)}/album/${encodeUrlName(title)}-${id}`
}
export const fullAlbumPage = (handle: string, title: string, id: ID) => {
  return `${BASE_URL}${albumPage(handle, title, id)}`
}

export const collectionPage = (
  handle: string,
  playlistName?: string | null,
  playlistId?: ID | null,
  permalink?: string | null,
  isAlbum?: boolean
) => {
  // Prioritize permalink if available. If not, default to legacy routing
  if (permalink) {
    return permalink
  } else if (playlistName && playlistId) {
    const collectionType = isAlbum ? 'album' : 'playlist'
    return `/${encodeUrlName(handle)}/${collectionType}/${encodeUrlName(
      playlistName
    )}-${playlistId}`
  } else {
    console.error('Missing required arguments to get PlaylistPage route.')
    return ''
  }
}
export const fullCollectionPage = (
  handle: string,
  playlistName?: string | null,
  playlistId?: ID | null,
  permalink?: string | null,
  isAlbum?: boolean
) => {
  return `${BASE_URL}${collectionPage(
    handle,
    playlistName,
    playlistId,
    permalink,
    isAlbum
  )}`
}

export const audioNftPlaylistPage = (handle: string) => {
  return `/${encodeUrlName(handle)}/audio-nft-playlist`
}
export const fullAudioNftPlaylistPage = (handle: string) => {
  return `${BASE_URL}${audioNftPlaylistPage(handle)}`
}

export const collectibleDetailsPage = (
  handle: string,
  collectibleId: string
) => {
  return `/${encodeUrlName(handle)}/collectibles/${getHash(collectibleId)}`
}
export const fullCollectibleDetailsPage = (
  handle: string,
  collectibleId: string
) => {
  return `${BASE_URL}${collectibleDetailsPage(handle, collectibleId)}`
}

export const profilePage = (handle: string) => {
  return `/${encodeUrlName(handle)}`
}
export const fullProfilePage = (handle: string) => {
  return `${BASE_URL}${profilePage(handle)}`
}
export const profilePageAiAttributedTracks = (handle: string) => {
  return `${profilePage(handle)}/ai`
}

export const searchResultsPage = (query: string) => {
  return `/search/${query}`
}

export const fullSearchResultsPage = (query: string) => {
  return `${BASE_URL}${searchResultsPage(query)}`
}

export const exploreMoodPlaylistsPage = (mood: string) => {
  return `/explore/${mood}`
}

export const chatPage = (id: string) => {
  return `/messages/${id}`
}

export const doesMatchRoute = (route: string, exact = true) => {
  return matchPath(getPathname(), {
    path: route,
    exact
  })
}

export const stripBaseUrl = (url: string) => url.replace(BASE_URL, '')

/**
 * Gets the pathname from the location or the hashed path name
 * if using hash routing
 * @param {Location} location
 */
export const getPathname = (
  location: Location | HistoryLocation = window.location
) => {
  // If this is a Location, pathname will have a host. If it's a HistoryLocation,
  // the hashrouter will automatically understand the pathname to be the hash route
  if (USE_HASH_ROUTING && 'host' in location) {
    return location.hash.replace('#', '')
  }
  return BASENAME ? location.pathname.replace(BASENAME, '') : location.pathname
}

/**
 * For a given route, checks if any of the previous routes in the `orderedRoutes` array matches the window's pathname
 * Returns true if none of the previous routes mach and it does, otherwise false.
 */
export const doesRenderPage = (pageRoute: string) => {
  const pgIndex = orderedRoutes.findIndex((route) => route === pageRoute)
  if (pgIndex === -1) return false
  const noPreviousMatches = orderedRoutes.slice(0, pgIndex).every((route) => {
    return !matchPath(getPathname(), {
      path: route,
      exact: true
    })
  })
  if (!noPreviousMatches) return false
  return matchPath(getPathname(), {
    path: pageRoute,
    exact: true
  })
}

export const recordGoToSignup = (callback: () => void) => {
  if ((window as any).analytics) {
    ;(window as any).analytics.track(
      'Create Account: Open',
      { source: 'landing page' },
      null,
      callback
    )
  } else {
    callback()
  }
}

/**
 * Forces a reload of the window by manually setting the location.href
 */
export const pushWindowRoute = (route: string) => {
  let routeToPush: string
  if (USE_HASH_ROUTING) {
    routeToPush = `/#${route}`
  } else {
    routeToPush = route
  }

  if (route === SIGN_UP_PAGE) {
    recordGoToSignup(() => {
      window.location.href = `${BASENAME}${routeToPush}`
    })
  } else {
    window.location.href = `${BASENAME}${routeToPush}`
  }
}

/**
 * Only calls push route if unique (not current route)
 */
export const pushUniqueRoute = (route: string) => {
  const pathname = getPathname()
  if (route !== pathname) {
    return pushRoute(route)
  }
  return { type: '' }
}
