import { useParams } from 'react-router-dom'

import { TrackResultsPage } from './search-results/TrackResults'
import { AllResults } from './search-results/AllResults'

import { ProfileResultsPage } from './search-results/ProfileResults'
import { CategoryView } from './types'
import { AlbumResultsPage } from './search-results/AlbumResults'
import { PlaylistResultsPage } from './search-results/PlaylistResults'

export const SearchResults = () => {
  const { category } = useParams<{ category: CategoryView }>()

  switch (category) {
    case 'all':
      return <AllResults />
    case 'profiles':
      return <ProfileResultsPage />
    case 'tracks':
      return <TrackResultsPage />
    case 'albums':
      return <AlbumResultsPage />
    case 'playlists':
      return <PlaylistResultsPage />
  }
}
