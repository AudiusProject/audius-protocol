import { ProfileResults } from './ProfileResults'
import { TrackResults } from './TrackResults'
import { useSearchCategory } from '../searchState'

export const SearchResults = () => {
  const [category] = useSearchCategory()

  switch (category) {
    case 'users':
      return <ProfileResults />
    case 'tracks':
      return <TrackResults />
  }

  return null
}
