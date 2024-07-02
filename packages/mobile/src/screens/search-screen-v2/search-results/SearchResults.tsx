import { useSearchCategory } from '../searchState'

import { ProfileResults } from './ProfileResults'
import { TrackResults } from './TrackResults'

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
