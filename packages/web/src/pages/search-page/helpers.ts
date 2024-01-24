import { SearchKind } from '@audius/common'
import { Location } from 'history'
import { matchPath } from 'react-router'

import { env } from 'services/env'
import { getPathname } from 'utils/route'

const USE_HASH_ROUTING = env.USE_HASH_ROUTING

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

export const isTagSearch = (location: Location) => {
  if (USE_HASH_ROUTING) {
    // URL will look like /#/search/#tag, so check if there are
    // more than two things when we split on #
    return location.hash.split('#').length > 2
  }
  return !!location.hash
}

export const getCategory = (location: Location) => {
  let category
  if (isTagSearch(location)) {
    category = location.hash.slice(1).split('/')[1]
  } else {
    const categoryMatch = matchPath(getPathname(location), {
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

export const getSearchTag = (location: Location) => {
  // Trim off the leading '#' and remove any other paths (e.g. category)
  if (USE_HASH_ROUTING) {
    return getPathname(location).split('#')[1].split('/')[0]
  }
  return location.hash.slice(1).split('/')[0]
}

export const getSearchText = (location: Location) => {
  const match = matchPath(getPathname(location), {
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
export const getQuery = (location: Location) =>
  isTagSearch(location) ? `#${getSearchTag(location)}` : getSearchText(location)

export const getResultsLimit = (isMobile: boolean, category: SearchKind) => {
  return isMobile
    ? MOBILE_ALL_CATEGORY_RESULTS_LIMIT
    : category === SearchKind.ALL
    ? DESKTOP_ALL_CATEGORY_RESULTS_LIMIT
    : DESKTOP_SINGLE_CATEGORY_RESULTS_LIMIT
}
