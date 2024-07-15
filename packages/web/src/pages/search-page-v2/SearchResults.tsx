import { useParams } from 'react-router-dom'

import { TrackResultsPage } from './search-results/TrackResults'
import { CategoryView } from './types'

export const SearchResults = () => {
  const { category } = useParams<{ category: CategoryView }>()

  switch (category) {
    // case 'all':
    //   return <AllResults />
    // case 'users':
    //   return <ProfileResults />
    case 'tracks':
      return <TrackResultsPage />
    // case 'albums':
    //   return <AlbumResults />
    // case 'playlists':
    //   return <PlaylistResults />
  }
}
