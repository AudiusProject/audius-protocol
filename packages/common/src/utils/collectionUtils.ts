import { AccountCollection } from '~/store/account'
import { EnhancedCollection } from '~/store/cache/collections/selectors'

type FilterCollectionsOptions = {
  filterText?: string
}

export const isAccountCollection = (
  collection: AccountCollection | EnhancedCollection
): collection is AccountCollection => {
  return (collection as AccountCollection).name !== undefined
}

export function filterCollections<
  T extends AccountCollection | EnhancedCollection
>(collections: T[], { filterText = '' }: FilterCollectionsOptions): T[] {
  return collections.filter((item: AccountCollection | EnhancedCollection) => {
    const name = isAccountCollection(item) ? item.name : item.playlist_name
    const matchesPlaylistName =
      name.toLowerCase().indexOf(filterText.toLowerCase()) > -1
    const matchesOwnerName =
      item.user.handle.toLowerCase().indexOf(filterText.toLowerCase()) > -1

    return matchesPlaylistName || matchesOwnerName
  })
}
