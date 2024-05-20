import { groupBy } from 'lodash'

import { createApi } from '~/audius-query'
import { Kind } from '~/models'
import { SearchItem } from '~/store'
import { encodeHashId } from '~/utils'
import { useGetTrackById, useGetTracksByIds } from './track'
import { useSelector } from 'react-redux'
import { getUserId } from '~/store/account/selectors'

type GetRecentSearchesArgs = {
  searchItems: SearchItem[]
}

export const useGetRecentSearches = (args: GetRecentSearchesArgs) => {
  const currentUserId = useSelector(getUserId)
  // Make requests for tracks, users, albums, playlists
  const groups = groupBy(args.searchItems, ({ kind }) => kind)

  const { data: tracks } = useGetTracksByIds({
    ids: (groups[Kind.TRACKS] ?? []).map(({ id }) => id),
    currentUserId
  })

  //   const { data: tracks } = groups[Kind.TRACKS]
  //     ? await sdk.full.tracks.getBulkTracks({
  //         id: groups[Kind.TRACKS].map(({ id }) => encodeHashId(id))
  //       })
  //     : { data: [] }

  // Map the results back to the original search item order
  console.log('tracks', tracks)
  return args.searchItems
    .map((searchItem) => {
      return {
        ...searchItem,
        item: tracks?.find(({ track_id }) => track_id === searchItem.id)
      }
    })
    .filter(({ item }) => item)
}

const searchApi = createApi({
  reducerPath: 'searchApi',
  endpoints: {
    getRecentSearches: {
      async fetch(args: GetRecentSearchesArgs, { audiusSdk }) {
        // Make requests for tracks, users, albums, playlists
        const sdk = await audiusSdk()

        const groups = groupBy(args.searchItems, ({ kind }) => kind)

        const { data: tracks } = groups[Kind.TRACKS]
          ? await sdk.full.tracks.getBulkTracks({
              id: groups[Kind.TRACKS].map(({ id }) => encodeHashId(id))
            })
          : { data: [] }

        return args.searchItems.map((item) => {
          const encodedId = encodeHashId(item.id)
          return {
            ...item,
            item: tracks?.find(({ id }) => id === encodedId)!
          }
        })
      },
      options: {}
    }
  }
})

// export const { useGetRecentSearches } = searchApi.hooks
export const searchApiReducer = searchApi.reducer
