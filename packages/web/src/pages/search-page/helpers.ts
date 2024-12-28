import { route } from '@audius/common/utils'
import { Location } from 'history'
import { matchPath } from 'react-router-dom'

const { SEARCH_PAGE } = route

type SearchCategory = 'tracks' | 'users' | 'playlists' | 'albums' | 'all'

export const getCategory = (location: Location): SearchCategory => {
  const categoryMatch = matchPath(SEARCH_PAGE, location.pathname)
  if (categoryMatch) {
    const { category = '' } = categoryMatch.params
    if (
      category === 'tracks' ||
      category === 'users' ||
      category === 'playlists' ||
      category === 'albums'
    ) {
      return category as SearchCategory
    }
  }
  return 'all'
}
