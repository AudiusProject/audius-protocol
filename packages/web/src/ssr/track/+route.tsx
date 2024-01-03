import { resolveRoute } from 'vike/routing'
import { PageContextServer } from 'vike/types'

// TODO: pull these from a common file

// Static routes.
const FEED_PAGE = '/feed'
const TRENDING_PAGE = '/trending'

const EXPLORE_PAGE = '/explore'

// DEPRECATED - use /library instead.
const SAVED_PAGE = '/favorites'
const FAVORITES_PAGE = '/favorites'

const LIBRARY_PAGE = '/library'
const HISTORY_PAGE = '/history'
const DASHBOARD_PAGE = '/dashboard'
const AUDIO_PAGE = '/audio'
const AUDIO_TRANSACTIONS_PAGE = '/audio/transactions'
const UPLOAD_PAGE = '/upload'
const UPLOAD_ALBUM_PAGE = '/upload/album'
const UPLOAD_PLAYLIST_PAGE = '/upload/playlist'
const SETTINGS_PAGE = '/settings'
const HOME_PAGE = '/'
const NOT_FOUND_PAGE = '/404'
const SIGN_IN_PAGE = '/signin'
const SIGN_UP_PAGE = '/signup'
const NOTIFICATION_PAGE = '/notifications'
const APP_REDIRECT = '/app-redirect'
const PAYMENTS_PAGE = '/payments'
const PURCHASES_PAGE = '/payments/purchases'
const SALES_PAGE = '/payments/sales'
const WITHDRAWALS_PAGE = '/payments/withdrawals'

// Mobile Only Routes
const REPOSTING_USERS_ROUTE = '/reposting_users'
const FAVORITING_USERS_ROUTE = '/favoriting_users'
const FOLLOWING_USERS_ROUTE = '/following'
const FOLLOWERS_USERS_ROUTE = '/followers'
export const SUPPORTING_USERS_ROUTE = '/supporting'
const TOP_SUPPORTERS_USERS_ROUTE = '/top-supporters'
const ACCOUNT_SETTINGS_PAGE = '/settings/account'
const NOTIFICATION_SETTINGS_PAGE = '/settings/notifications'
const ABOUT_SETTINGS_PAGE = '/settings/about'
const TRENDING_GENRES = '/trending/genres'
const EMPTY_PAGE = '/empty_page'

const staticRoutes = new Set([
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

export default (pageContext: PageContextServer) => {
  // Don't render track page if the route matches any of the static routes
  if (staticRoutes.has(pageContext.urlPathname)) {
    return false
  }

  return resolveRoute('/@handle/@slug', pageContext.urlPathname)
}
