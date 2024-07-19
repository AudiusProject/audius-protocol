import { useParams } from 'react-router-dom'

import { AlbumResultsPage } from './search-results/AlbumResults'
import { AllResults } from './search-results/AllResults'
import { PlaylistResultsPage } from './search-results/PlaylistResults'
import { ProfileResultsPage } from './search-results/ProfileResults'
import { TrackResultsPage } from './search-results/TrackResults'
import { CategoryView } from './types'

type SearchResultsProps = {
  prevSearchParams: any
}

export const SearchResults = ({ prevSearchParams }: SearchResultsProps) => {
  const { category } = useParams<{ category: CategoryView }>()

  switch (category) {
    case 'profiles':
      return <ProfileResultsPage />
    case 'tracks':
      return <TrackResultsPage prevSearchParams={prevSearchParams} />
    case 'albums':
      return <AlbumResultsPage />
    case 'playlists':
      return <PlaylistResultsPage />
    default:
      return <AllResults />
  }
}
