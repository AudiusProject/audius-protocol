import {
  trackActivityFromSDK,
  transformAndCleanList
} from '@audius/common/adapters'
import { primeTrackDataSaga, queryCurrentAccount } from '@audius/common/api'
import { FavoriteType, Favorite } from '@audius/common/models'
import {
  libraryPageTracksLineupActions as tracksActions,
  libraryPageActions as actions,
  libraryPageSelectors,
  getContext,
  LibraryCategoryType
} from '@audius/common/store'
import { Nullable } from '@audius/common/utils'
import { full, HashId, Id } from '@audius/sdk'
import { call, fork, put, select, takeLatest } from 'typed-redux-saga'

import { waitForRead } from 'utils/sagaHelpers'

import tracksSagas from './lineups/sagas'

const { getTrackSaves } = libraryPageSelectors

function* fetchLineupMetadatas(offset: number, limit: number) {
  const isNativeMobile = yield* getContext('isNativeMobile')

  // Mobile currently uses infinite scroll instead of a virtualized list
  // so we need to apply the offset & limit
  if (isNativeMobile) {
    yield* put(tracksActions.fetchLineupMetadatas(offset, limit))
  } else {
    yield* put(tracksActions.fetchLineupMetadatas())
  }
}

type LibraryParams = {
  userId: number
  offset: number
  limit: number
  query: string
  sortMethod: string
  sortDirection: string
  category: LibraryCategoryType
}

function* sendLibraryRequest({
  userId,
  offset,
  limit,
  query,
  sortMethod,
  sortDirection,
  category
}: LibraryParams) {
  const audiusSdk = yield* getContext('audiusSdk')
  const sdk = yield* call(audiusSdk)

  const libraryTracksResponse = yield* call(
    [sdk.full.users, sdk.full.users.getUserLibraryTracks],
    {
      id: Id.parse(userId),
      userId: Id.parse(userId),
      offset,
      limit,
      query,
      sortMethod: sortMethod as full.GetUserLibraryTracksSortMethodEnum,
      sortDirection:
        sortDirection as full.GetUserLibraryTracksSortDirectionEnum,
      type: category
    }
  )

  const libraryTracksResponseData = libraryTracksResponse.data ?? []
  const tracks = transformAndCleanList(
    libraryTracksResponse.data,
    (activity: full.ActivityFull) => trackActivityFromSDK(activity)?.item
  )

  if (!tracks) {
    throw new Error('Something went wrong with library tracks request.')
  }

  const saves = libraryTracksResponseData
    .filter((save) => Boolean(save.timestamp && save.item))
    .map((save) => ({
      created_at: save.timestamp!,
      save_item_id: HashId.parse(save.item!.id!),
      save_type: FavoriteType.TRACK,
      user_id: userId
    })) as Favorite[]

  return {
    saves,
    tracks
  }
}

function prepareParams({
  account: { userId, trackSaveCount },
  params
}: {
  account: { userId: number; trackSaveCount: number }
  params: ReturnType<typeof actions.fetchSaves>
}) {
  return {
    userId,
    offset: params.offset ?? 0,
    limit: params.limit ?? trackSaveCount,
    query: params.query,
    sortMethod: params.sortMethod || 'added_date',
    sortDirection: params.sortDirection || 'desc',
    category: params.category
  }
}

function* watchFetchSaves() {
  let currentQuery = ''
  let currentSortMethod = ''
  let currentSortDirection = ''
  let currentCategory = null as Nullable<LibraryCategoryType>

  yield* takeLatest(
    actions.FETCH_SAVES,
    function* (rawParams: ReturnType<typeof actions.fetchSaves>) {
      yield* waitForRead()
      const accountData = yield* call(queryCurrentAccount)
      if (!accountData) return
      const { userId, trackSaveCount } = accountData
      const saves = yield* select(getTrackSaves)
      const params = prepareParams({
        account: { userId: userId!, trackSaveCount: trackSaveCount! },
        params: rawParams
      })
      const { query, sortDirection, sortMethod, offset, limit, category } =
        params
      const isSameParams =
        query === currentQuery &&
        currentSortDirection === sortDirection &&
        currentSortMethod === sortMethod &&
        currentCategory === category

      // Don't refetch saves in the same session
      if (saves && saves.length && isSameParams) {
        yield* fork(fetchLineupMetadatas, offset, limit)
      } else {
        try {
          currentQuery = query
          currentSortDirection = sortDirection
          currentSortMethod = sortMethod
          currentCategory = category
          yield* put(actions.fetchSavesRequested())
          const { saves, tracks } = yield* call(sendLibraryRequest, params)

          yield* call(primeTrackDataSaga, tracks)

          const fullSaves = Array(trackSaveCount)
            .fill(0)
            .map((_) => ({})) as Favorite[]

          fullSaves.splice(offset, saves.length, ...saves)
          yield* put(actions.fetchSavesSucceeded(fullSaves))
          if (limit > 0 && saves.length < limit) {
            yield* put(actions.endFetching(offset + saves.length))
          }
          yield* fork(fetchLineupMetadatas, offset, limit)
        } catch (e) {
          yield* put(actions.fetchSavesFailed())
        }
      }
    }
  )
}

function* watchFetchMoreSaves() {
  yield* takeLatest(
    actions.FETCH_MORE_SAVES,
    function* (rawParams: ReturnType<typeof actions.fetchMoreSaves>) {
      yield* waitForRead()
      const account = yield* queryCurrentAccount()
      const { userId, trackSaveCount } = account ?? {}
      const params = prepareParams({
        account: {
          userId: userId!,
          trackSaveCount: trackSaveCount!
        },
        params: rawParams
      })

      const { limit, offset } = params

      try {
        const { saves, tracks } = yield* call(sendLibraryRequest, params)
        yield* call(primeTrackDataSaga, tracks)
        yield* put(actions.fetchMoreSavesSucceeded(saves, offset))

        if (limit > 0 && saves.length < limit) {
          yield* put(actions.endFetching(offset + saves.length))
        }
        yield* fork(fetchLineupMetadatas, offset, limit)
      } catch (e) {
        yield* put(actions.fetchMoreSavesFailed())
      }
    }
  )
}

export default function sagas() {
  return [...tracksSagas(), watchFetchSaves, watchFetchMoreSaves]
}
