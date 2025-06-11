import { AccountCollection, Collection } from '~/models/Collection'

type FilterCollectionsOptions = {
  filterText?: string
}

export const isAccountCollection = (
  collection: AccountCollection | Collection
): collection is AccountCollection => {
  return (collection as AccountCollection).name !== undefined
}

export function filterCollections<T extends AccountCollection | Collection>(
  collections: T[],
  { filterText = '' }: FilterCollectionsOptions
): T[] {
  return collections.filter((item: AccountCollection | Collection) => {
    const name = isAccountCollection(item) ? item.name : item.playlist_name
    return name.toLowerCase().indexOf(filterText.toLowerCase()) > -1
  })
}
