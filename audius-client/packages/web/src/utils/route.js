import { encodeUrlName } from 'utils/formatUtil'
import { matchPath } from 'react-router'
import { push as pushRoute } from 'connected-react-router'

// Host/protocol.
export const BASE_URL = `${
  process.env.REACT_APP_PUBLIC_PROTOCOL || 'https:'
}//${process.env.REACT_APP_PUBLIC_HOSTNAME || 'audius.co'}`
export const BASE_GA_URL = `${
  process.env.REACT_APP_PUBLIC_PROTOCOL || 'https:'
}//${process.env.REACT_APP_GA_HOSTNAME || 'audius.co'}`
export const BASENAME = process.env.PUBLIC_URL

// External Routes
export const PRIVACY_POLICY = '/legal/privacy-policy'
export const COOKIE_POLICY = `${BASE_URL}${PRIVACY_POLICY}`
export const TERMS_OF_SERVICE = '/legal/terms-of-use'

// Static routes.
export const FEED_PAGE = '/feed'
export const TRENDING_PAGE = '/trending'

export const EXPLORE_PAGE = '/explore'
export const EXPLORE_HEAVY_ROTATION_PAGE = '/explore/heavy-rotation'
export const EXPLORE_LET_THEM_DJ_PAGE = '/explore/let-them-dj'
export const EXPLORE_BEST_NEW_RELEASES_PAGE = '/explore/best-new-releases'
export const EXPLORE_UNDER_THE_RADAR_PAGE = '/explore/under-the-radar'
export const EXPLORE_TOP_ALBUMS_PAGE = '/explore/top-albums'
export const EXPLORE_TOP_PLAYLISTS_PAGE = '/explore/top-playlists'
export const EXPLORE_MOST_LOVED_PAGE = '/explore/most-loved'
export const EXPLORE_FEELING_LUCKY_PAGE = '/explore/feeling-lucky'
export const EXPLORE_MOOD_PLAYLISTS_PAGE = '/explore/:mood'

export const SAVED_PAGE = '/favorites'
export const FAVORITES_PAGE = '/favorites'
export const HISTORY_PAGE = '/history'
export const DASHBOARD_PAGE = '/dashboard'
export const UPLOAD_PAGE = '/upload'
export const UPLOAD_ALBUM_PAGE = '/upload/album'
export const UPLOAD_PLAYLIST_PAGE = '/upload/playlist'
export const SETTINGS_PAGE = '/settings'
export const HOME_PAGE = '/'
export const NOT_FOUND_PAGE = '/404'
export const SIGN_IN_PAGE = '/signin'
export const SIGN_UP_PAGE = '/signup'
export const ERROR_PAGE = '/error'
export const NOTIFICATION_PAGE = '/notifications'
export const APP_REDIRECT = '/app-redirect'

// Param routes.
export const NOTIFICATION_USERS_PAGE = '/notification/:notificationId/users'
export const ANNOUNCEMENT_PAGE = '/notification/:notificationId'
export const SEARCH_CATEGORY_PAGE = '/search/:query/:category'
export const SEARCH_PAGE = '/search/:query?'
export const PLAYLIST_PAGE = '/:handle/playlist/:playlistName'
export const ALBUM_PAGE = '/:handle/album/:albumName'
export const TRACK_PAGE = '/:handle/:trackName'
export const TRACK_REMIXES_PAGE = '/:handle/:trackName/remixes'
export const PROFILE_PAGE = '/:handle'
// Opaque id routes
export const TRACK_ID_PAGE = '/tracks/:id'
export const USER_ID_PAGE = '/users/:id'
export const PLAYLIST_ID_PAGE = '/playlists/:id'

// Mobile Only Routes
export const REPOSTING_USERS_ROUTE = '/reposting_users'
export const FAVORITING_USERS_ROUTE = '/favoriting_users'
export const FOLLOWING_USERS_ROUTE = '/following'
export const FOLLOWERS_USERS_ROUTE = '/followers'
export const ACCOUNT_SETTINGS_PAGE = '/settings/account'
export const ACCOUNT_VERIFICATION_SETTINGS_PAGE =
  '/settings/account/verification'
export const NOTIFICATION_SETTINGS_PAGE = '/settings/notifications'
export const ABOUT_SETTINGS_PAGE = '/settings/about'
export const TRENDING_GENRES = '/trending/genres'

export const authenticatedRoutes = [
  FEED_PAGE,
  SAVED_PAGE,
  HISTORY_PAGE,
  UPLOAD_PAGE,
  SETTINGS_PAGE
]

// ordered list of routes the App attempts to match in increasing order of route selectivity
export const orderedRoutes = [
  ERROR_PAGE,
  SIGN_IN_PAGE,
  SIGN_UP_PAGE,
  FEED_PAGE,
  NOTIFICATION_USERS_PAGE,
  ANNOUNCEMENT_PAGE,
  NOTIFICATION_PAGE,
  TRENDING_GENRES,
  TRENDING_PAGE,
  EXPLORE_PAGE,
  SEARCH_CATEGORY_PAGE,
  SEARCH_PAGE,
  UPLOAD_ALBUM_PAGE,
  UPLOAD_PLAYLIST_PAGE,
  UPLOAD_PAGE,
  SAVED_PAGE,
  HISTORY_PAGE,
  DASHBOARD_PAGE,
  SETTINGS_PAGE,
  ACCOUNT_SETTINGS_PAGE,
  NOTIFICATION_SETTINGS_PAGE,
  ABOUT_SETTINGS_PAGE,
  NOT_FOUND_PAGE,
  HOME_PAGE,
  PLAYLIST_PAGE,
  ALBUM_PAGE,
  TRACK_PAGE,
  REPOSTING_USERS_ROUTE,
  FAVORITING_USERS_ROUTE,
  FOLLOWING_USERS_ROUTE,
  FOLLOWERS_USERS_ROUTE,
  PROFILE_PAGE
]

export const staticRoutes = new Set([
  FEED_PAGE,
  TRENDING_PAGE,
  EXPLORE_PAGE,
  SAVED_PAGE,
  FAVORITES_PAGE,
  HISTORY_PAGE,
  DASHBOARD_PAGE,
  UPLOAD_PAGE,
  UPLOAD_ALBUM_PAGE,
  UPLOAD_PLAYLIST_PAGE,
  SETTINGS_PAGE,
  HOME_PAGE,
  NOT_FOUND_PAGE,
  SIGN_IN_PAGE,
  SIGN_UP_PAGE,
  ERROR_PAGE,
  NOTIFICATION_PAGE,
  APP_REDIRECT,
  REPOSTING_USERS_ROUTE,
  FAVORITING_USERS_ROUTE,
  FOLLOWING_USERS_ROUTE,
  FOLLOWERS_USERS_ROUTE,
  ACCOUNT_SETTINGS_PAGE,
  NOTIFICATION_SETTINGS_PAGE,
  ABOUT_SETTINGS_PAGE,
  TRENDING_GENRES
])

/**
 * For a given route, checks if any of the previous routes in the `orderedRoutes` array matches the window's pathname
 * Returns true if none of the previous routes mach and it does, otherwise false.
 */
export const doesRenderPage = pageRoute => {
  const pgIndex = orderedRoutes.findIndex(route => route === pageRoute)
  if (pgIndex === -1) return false
  const noPreviousMatches = orderedRoutes.slice(0, pgIndex).every(route => {
    return !matchPath(window.location.pathname, {
      path: route,
      exact: true
    })
  })
  if (!noPreviousMatches) return false
  return matchPath(window.location.pathname, {
    path: pageRoute,
    exact: true
  })
}

/** Given a pathname, finds a matching route */
export const findRoute = pathname => {
  for (const route of orderedRoutes) {
    const match = matchPath(pathname, { path: route, exact: true })
    if (match) {
      return route
    }
  }
  return null
}

// Create full formed urls for routes.
export const trackPage = (handle, title, id) => {
  return `/${encodeUrlName(handle)}/${encodeUrlName(title)}-${id}`
}
export const fullTrackPage = (handle, title, id) => {
  return `${BASE_URL}${trackPage(handle, title, id)}`
}

export const trackRemixesPage = (handle, title, id) => {
  return `${trackPage(handle, title, id)}/remixes`
}
export const fullTrackRemixesPage = (handle, title, id) => {
  return `${fullTrackPage(handle, title, id)}/remixes`
}

export const albumPage = (handle, title, id) => {
  return `/${encodeUrlName(handle)}/album/${encodeUrlName(title)}-${id}`
}
export const fullAlbumPage = (handle, title, id) => {
  return `${BASE_URL}${albumPage(handle, title, id)}`
}

export const playlistPage = (handle, title, id) => {
  return `/${encodeUrlName(handle)}/playlist/${encodeUrlName(title)}-${id}`
}
export const fullPlaylistPage = (handle, title, id) => {
  return `${BASE_URL}${playlistPage(handle, title, id)}`
}

export const profilePage = handle => {
  return `/${encodeUrlName(handle)}`
}
export const fullProfilePage = handle => {
  return `${BASE_URL}${profilePage(handle)}`
}

export const searchResultsPage = query => {
  return `/search/${query}`
}

export const fullSearchResultsPage = query => {
  return `${BASE_URL}${searchResultsPage(query)}`
}

export const exploreMoodPlaylistsPage = mood => {
  return `/explore/${mood}`
}

export const doesMatchRoute = (route, exact = true) => {
  return matchPath(window.location.pathname, {
    path: route,
    exact
  })
}

export const stripBaseUrl = url => url.replace(BASE_URL, '')

export const getPathname = () => {
  return BASENAME
    ? window.location.pathname.replace(BASENAME, '')
    : window.location.pathname
}

// Only calls push route if unique
export const pushUniqueRoute = route => {
  if (route !== window.location.pathname) {
    return pushRoute(route)
  }
  return { type: '' }
}
