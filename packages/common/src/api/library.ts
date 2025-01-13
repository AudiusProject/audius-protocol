import { Id, type full } from '@audius/sdk'

import { userCollectionMetadataFromSDK } from '~/adapters/collection'
import { transformAndCleanList } from '~/adapters/utils'
import { AudiusQueryContextType, createApi } from '~/audius-query'
import { Kind } from '~/models/Kind'

type GetLibraryItemsArgs = {
  userId: number
  offset: number
  limit: number
  category: full.GetUserLibraryAlbumsTypeEnum
  query?: string
  sortMethod?: full.GetUserLibraryAlbumsSortMethodEnum
  sortDirection?: full.GetUserLibraryAlbumsSortDirectionEnum
}
const COLLECTIONS_CACHE_OPTIONS = {
  kind: Kind.COLLECTIONS,
  schemaKey: 'collections'
}

const fetchLibraryCollections = async ({
  args,
  context,
  collectionType
}: {
  args: GetLibraryItemsArgs
  context: AudiusQueryContextType
  collectionType: 'album' | 'playlist'
}) => {
  const { audiusSdk } = context
  const {
    userId,
    offset,
    limit,
    category,
    query,
    sortMethod = 'added_date',
    sortDirection = 'desc'
  } = args
  const sdk = await audiusSdk()

  const requestParams = {
    id: Id.parse(userId),
    userId: Id.parse(userId),
    offset,
    limit,
    query,
    sortMethod,
    sortDirection,
    type: category
  }
  const { data: activities = [] } =
    collectionType === 'album'
      ? await sdk.full.users.getUserLibraryAlbums(requestParams)
      : await sdk.full.users.getUserLibraryPlaylists(requestParams)
  return transformAndCleanList(activities, ({ item }) =>
    userCollectionMetadataFromSDK(item)
  )
}

export const libraryApi = createApi({
  reducerPath: 'libraryApi',
  endpoints: {
    getLibraryPlaylists: {
      fetch: async (args: GetLibraryItemsArgs, context) => {
        const playlists = await fetchLibraryCollections({
          args,
          context,
          collectionType: 'playlist'
        })
        return playlists
      },
      options: COLLECTIONS_CACHE_OPTIONS
    },
    getLibraryAlbums: {
      fetch: async (args: GetLibraryItemsArgs, context) => {
        const albums = await fetchLibraryCollections({
          args,
          context,
          collectionType: 'album'
        })
        return albums
      },
      options: COLLECTIONS_CACHE_OPTIONS
    }
  }
})
export const { useGetLibraryAlbums, useGetLibraryPlaylists } = libraryApi.hooks
export const libraryApiReducer = libraryApi.reducer
