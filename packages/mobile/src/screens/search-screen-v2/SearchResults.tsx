import { ProfileResults } from './ProfileResults'
import { useSearchCategory } from './searchState'

export const SearchResults = () => {
  const [category] = useSearchCategory()

  switch (category) {
    case 'users':
      return <ProfileResults />
  }

  return null
}
