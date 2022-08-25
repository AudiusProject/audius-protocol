import {
  ID,
  Collection,
  UserCollectionMetadata,
  FeedFilter,
  Kind,
  LineupTrack,
  TrackMetadata,
  UserTrackMetadata,
  getContext,
  accountSelectors,
  feedPageLineupActions as feedActions,
  feedPageSelectors,
  GetSocialFeedArgs,
  CommonState,
  waitForAccount
} from '@audius/common'
import { select, all } from 'redux-saga/effects'

import { processAndCacheCollections } from 'common/store/cache/collections/utils'
import { processAndCacheTracks } from 'common/store/cache/tracks/utils'
import {
  getAccountReady,
  getFollowIds,
  getStartedSignOnProcess
} from 'common/store/pages/signon/selectors'
import { LineupSagas } from 'store/lineup/sagas'
const { getFeedFilter } = feedPageSelectors
const getAccountUser = accountSelectors.getAccountUser

type FeedItem = LineupTrack | Collection

const filterMap = {
  [FeedFilter.ALL]: 'all',
  [FeedFilter.ORIGINAL]: 'original',
  [FeedFilter.REPOST]: 'repost'
}

function* getTracks({
  offset,
  limit
}: {
  offset: number
  limit: number
}): Generator<any, FeedItem[], any> {
  yield* waitForAccount()
  const currentUser = yield select(getAccountUser)
  const filterEnum: FeedFilter = yield select(getFeedFilter)
  const apiClient = yield* getContext('apiClient')
  const filter = filterMap[filterEnum]

  // NOTE: The `/feed` does not paginate, so the feed is requested from 0 to N
  const params: GetSocialFeedArgs = {
    offset: 0,
    limit: offset + limit,
    filter,
    with_users: true,
    current_user_id: currentUser.user_id
  }

  // If the user just signed up, we might not have a feed ready.
  // Optimistically load the feed as though the follows are all confirmed.
  const startedSignOn = yield select(getStartedSignOnProcess)
  if (startedSignOn) {
    const isAccountReady = yield select(getAccountReady)
    if (!isAccountReady) {
      // Get the artists the user selected in signup:
      const followeeUserIds = yield select(getFollowIds)
      params.followee_user_ids = followeeUserIds
    }
  }

  const feed: (UserTrackMetadata | UserCollectionMetadata)[] =
    yield apiClient.getSocialFeed(params)
  if (!feed.length) return []
  const filteredFeed = feed.filter((record) => !record.user.is_deactivated)
  const [tracks, collections] = getTracksAndCollections(filteredFeed)
  const trackIds = tracks.map((t) => t.track_id)

  // Process (e.g. cache and remove entries)
  const [processedTracks, processedCollections]: [LineupTrack[], Collection[]] =
    yield all([
      processAndCacheTracks(tracks),
      processAndCacheCollections(collections, true, trackIds)
    ])
  const processedTracksMap = processedTracks.reduce<Record<ID, LineupTrack>>(
    (acc, cur) => ({ ...acc, [cur.track_id]: cur }),
    {}
  )
  const processedCollectionsMap = processedCollections.reduce<
    Record<ID, Collection>
  >((acc, cur) => ({ ...acc, [cur.playlist_id]: cur }), {})
  const processedFeed: FeedItem[] = filteredFeed.map((m) =>
    (m as LineupTrack).track_id
      ? processedTracksMap[(m as LineupTrack).track_id]
      : processedCollectionsMap[(m as UserCollectionMetadata).playlist_id]
  )
  return processedFeed
}

const getTracksAndCollections = (
  feed: Array<TrackMetadata | UserCollectionMetadata>
) =>
  feed.reduce<[LineupTrack[], UserCollectionMetadata[]]>(
    (acc, cur) =>
      (cur as LineupTrack).track_id
        ? [[...acc[0], cur as LineupTrack], acc[1]]
        : [acc[0], [...acc[1], cur as UserCollectionMetadata]],
    [[], []]
  )

const keepActivityTimeStamp = (
  entry: (LineupTrack | Collection) & { uid: string } // LineupSaga adds a UID to each entry
) => ({
  uid: entry.uid,
  kind: (entry as LineupTrack).track_id ? Kind.TRACKS : Kind.COLLECTIONS,
  id: (entry as LineupTrack).track_id || (entry as Collection).playlist_id,
  activityTimestamp: entry.activity_timestamp
})

class FeedSagas extends LineupSagas {
  constructor() {
    super(
      feedActions.prefix,
      feedActions,
      (store: CommonState) => store.pages.feed.feed,
      getTracks,
      keepActivityTimeStamp
    )
  }
}

export default function sagas() {
  return new FeedSagas().getSagas()
}
