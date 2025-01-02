import { route } from '@audius/common/utils'
import { resolveRoute } from 'vike/routing'
import type { PageContextServer } from 'vike/types'

const {
  staticRoutes,
  SEARCH_BASE_ROUTE,
  SEARCH_PAGE,
  PROFILE_PAGE_COLLECTIBLE_DETAILS,
  CHANGE_EMAIL_SETTINGS_PAGE,
  CHANGE_PASSWORD_SETTINGS_PAGE,
  CHATS_PAGE,
  CHAT_PAGE,
  DOWNLOAD_LINK
} = route

const assetPaths = new Set(['src', 'assets', 'scripts', 'fonts', 'favicons'])

const invalidPaths = new Set(['undefined'])

const nonSsrPaths = [
  PROFILE_PAGE_COLLECTIBLE_DETAILS,
  SEARCH_BASE_ROUTE,
  SEARCH_PAGE,
  CHANGE_EMAIL_SETTINGS_PAGE,
  CHANGE_PASSWORD_SETTINGS_PAGE,
  CHATS_PAGE,
  CHAT_PAGE,
  DOWNLOAD_LINK,
  '/react-query',
  '/react-query-cache-prime',
  '/react-query-redux-cache-sync',
  '/react-query-to-redux-cache-sync'
]

export const makePageRoute =
  (routes: string[], pageName?: string) =>
  ({ urlPathname }: PageContextServer) => {
    for (let i = 0; i < routes.length; i++) {
      const route = routes[i]

      // Don't render page if the route matches any of the asset, invalid, or static  routes
      if (
        assetPaths.has(urlPathname.split('/')[1]) ||
        invalidPaths.has(urlPathname.split('/')[1]) ||
        staticRoutes.has(urlPathname)
      ) {
        continue
      }

      if (
        urlPathname.split('/')[route.split('/').length - 1] === 'index.css.map'
      ) {
        continue
      }

      const result = resolveRoute(route, urlPathname)
      const nonSsrPathResult = nonSsrPaths.some(
        (path) => resolveRoute(path, urlPathname).match
      )

      if (result.match && !nonSsrPathResult) {
        console.info(`Rendering ${pageName ?? route}`, urlPathname)
        return result
      }
    }
    return false
  }

export const checkIsBot = (userAgent: string) => {
  if (!userAgent) {
    return false
  }
  const botTest =
    /discordbot|facebookexternalhit|gigabot|ia_archiver|linkbot|linkedinbot|reaper|slackbot|snap url preview service|telegrambot|twitterbot|whatsapp|whatsup|yeti|yodaobot|zend|zoominfobot|embedly/i
  return botTest.test(userAgent)
}

export const checkIsCrawler = (userAgent: string) => {
  if (!userAgent) {
    return false
  }
  const crawlerTest =
    /forcessr|ahrefs(bot|siteaudit)|altavista|baiduspider|bingbot|duckduckbot|googlebot|google-inspectiontool|msnbot|nextgensearchbot|yahoo|yandex/i
  return crawlerTest.test(userAgent)
}
