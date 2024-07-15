import { useParams } from 'react-router-dom'

import { TrackResultsPage } from './search-results/TrackResults'
import { AllResults } from './search-results/AllResults'
import { SearchKind } from '@audius/common/store'

export const SearchResults = () => {
  const { category } = useParams<{ category: SearchKind }>()

  switch (category) {
    case 'all':
      return <AllResults />
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
