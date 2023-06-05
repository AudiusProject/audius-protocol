import { AccountCollection } from 'store/account'

type FilterCollectionsOptions = {
  filterText?: string
}

export function filterCollections(
  collections: AccountCollection[],
  { filterText = '' }: FilterCollectionsOptions
): AccountCollection[] {
  return collections.filter((item: AccountCollection) => {
    if (filterText) {
      const matchesPlaylistName =
        item.name.toLowerCase().indexOf(filterText.toLowerCase()) > -1
      const matchesOwnerName =
        item.user.handle.toLowerCase().indexOf(filterText.toLowerCase()) > -1

      return matchesPlaylistName || matchesOwnerName
    }
    return true
  })
}
