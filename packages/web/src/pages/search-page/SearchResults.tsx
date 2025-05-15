import { useSearchCategory } from './hooks'
import { AlbumResultsPage } from './search-results/AlbumResults'
import { AllResults } from './search-results/AllResults'
import { PlaylistResultsPage } from './search-results/PlaylistResults'
import { ProfileResultsPage } from './search-results/ProfileResults'
import { TrackResultsPage } from './search-results/TrackResults'
import { ViewLayout } from './types'

type SearchResultsProps = {
  tracksLayout?: ViewLayout
}
export const SearchResults = ({ tracksLayout }: SearchResultsProps) => {
  const [category] = useSearchCategory()

  switch (category) {
    case 'profiles':
      return <ProfileResultsPage />
    case 'tracks':
      return <TrackResultsPage layout={tracksLayout} />
    case 'albums':
      return <AlbumResultsPage />
    case 'playlists':
      return <PlaylistResultsPage />
    default:
      return <AllResults />
  }
}
