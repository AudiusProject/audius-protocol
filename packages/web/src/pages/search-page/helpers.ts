import { SearchKind } from '@audius/common'
import { matchPath } from 'react-router'

import { getPathname } from 'utils/route'

const USE_HASH_ROUTING = process.env.VITE_USE_HASH_ROUTING === 'true'

type matchParams = {
  category?: string
  query?: string
}
type match = {
  params: matchParams
}

const DESKTOP_ALL_CATEGORY_RESULTS_LIMIT = 15
const MOBILE_ALL_CATEGORY_RESULTS_LIMIT = 15
const DESKTOP_SINGLE_CATEGORY_RESULTS_LIMIT = 40

export const isTagSearch = () => {
  if (USE_HASH_ROUTING) {
    // URL will look like /#/search/#tag, so check if there are
    // more than two things when we split on #
    return window.location.hash.split('#').length > 2
  }
  return !!window.location.hash
}

export const getCategory = (pathname: string) => {
  let category
  if (isTagSearch()) {
    category = window.location.hash.slice(1).split('/')[1]
  } else {
    const categoryMatch = matchPath(pathname, {
      path: '/search/:query/:category',
      exact: true
    }) as match

    if (
      categoryMatch &&
      categoryMatch.params &&
      categoryMatch.params.category
    ) {
      category = categoryMatch.params.category
    }
  }
  if (category) {
    switch (category) {
      case 'profiles':
        return SearchKind.USERS
      default:
        return category
    }
  }
  return SearchKind.ALL
}

export const getSearchTag = (pathname: string) => {
  // Trim off the leading '#' and remove any other paths (e.g. category)
  if (USE_HASH_ROUTING) {
    return pathname.split('#')[1].split('/')[0]
  }
  return window.location.hash.slice(1).split('/')[0]
}

export const getSearchText = (pathname: string) => {
  const match = matchPath(pathname, {
    path: '/search/:query'
  }) as match
  if (!match) return ''
  const query = match.params.query
  if (!query) return ''

  // Need to decode the URI to convert %20 into spaces
  try {
    const decoded = decodeURIComponent(query)
    return decoded
  } catch {
    return query
  }
}

// Returns a full query (e.g. `#rap` or `rap`), as opposed to
// `getSearchTag` which strips leading # from tags
export const getQuery = (pathname: string) =>
  isTagSearch() ? `#${getSearchTag(pathname)}` : getSearchText(pathname)

export const getResultsLimit = (isMobile: boolean, category: SearchKind) => {
  return isMobile
    ? MOBILE_ALL_CATEGORY_RESULTS_LIMIT
    : category === SearchKind.ALL
    ? DESKTOP_ALL_CATEGORY_RESULTS_LIMIT
    : DESKTOP_SINGLE_CATEGORY_RESULTS_LIMIT
}
