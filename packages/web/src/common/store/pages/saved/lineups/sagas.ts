import { Collection, Kind, LineupEntry, User } from '@audius/common/models'
import {
  cacheTracksSelectors,
  savedPageTracksLineupActions as savedTracksActions,
  savedPageActions as saveActions,
  savedPageSelectors,
  LibraryCategory,
  SavedPageTabs,
  queueActions,
  queueSelectors,
  QueueSource,
  tracksSocialActions,
  getContext,
  playerSelectors,
  purchaseContentActions,
  PurchaseableContentType,
  SavedPageTrack,
  accountSelectors
} from '@audius/common/store'
import { makeUid, waitForAccount } from '@audius/common/utils'
import moment from 'moment'
import { call, select, put, takeEvery } from 'typed-redux-saga'

import { retrieveTracks } from 'common/store/cache/tracks/utils'
import { LineupSagas } from 'common/store/lineup/sagas'
import { AppState } from 'store/types'

const { getUid: getPlayerUid } = playerSelectors
const { getSource } = queueSelectors
const { FETCH_SAVES, FETCH_MORE_SAVES } = saveActions
const { SAVE_TRACK, UNSAVE_TRACK, REPOST_TRACK, UNDO_REPOST_TRACK } =
  tracksSocialActions
const { getSavedTracksLineupUid, getTrackSaves, getCategory } =
  savedPageSelectors
const { purchaseConfirmed } = purchaseContentActions
const { getTracks: getCacheTracks } = cacheTracksSelectors

const getSavedTracks = (state: AppState) => state.pages.savedPage.tracks

const PREFIX = savedTracksActions.prefix

function* getTracks({
  offset,
  limit
}: {
  offset: number
  limit: number
}): Generator<any, SavedPageTrack[] | null, any> {
  const isNativeMobile = yield* getContext('isNativeMobile')
  const allSavedTracks = yield* select(getTrackSaves)
  // Mobile currently uses infinite scroll instead of a virtualized list
  // so we need to apply the offset & limit
  const savedTracks = isNativeMobile
    ? allSavedTracks.slice(offset, offset + limit)
    : allSavedTracks

  const savedTrackIds = savedTracks.map((save) => save.save_item_id ?? null)
  const savedTrackTimestamps = savedTracks.reduce<Record<number, string>>(
    (map, save) => {
      map[save.save_item_id] = save.created_at
      return map
    },
    {}
  )

  if (savedTrackIds.length > 0) {
    // @ts-ignore - Strings can be passed for the local save track ids
    const tracks = yield* call(retrieveTracks, {
      trackIds: savedTrackIds.filter((id) => id !== null)
    })
    const tracksMap = tracks.reduce<Record<number, SavedPageTrack>>(
      (map, track) => {
        const save = {
          ...track,
          dateSaved: savedTrackTimestamps[track.track_id]
        }

        map[track.track_id] = save as SavedPageTrack
        return map
      },
      {}
    )
    // @ts-ignore - empty case is expected but not by lineup
    return savedTrackIds.map((id) =>
      id ? tracksMap[id] : { kind: Kind.EMPTY }
    )
  }
  return []
}

const keepDateSaved = (entry: LineupEntry<SavedPageTrack | Collection>) => ({
  uid: entry.uid,
  kind: entry.kind ?? ('track_id' in entry ? Kind.TRACKS : Kind.COLLECTIONS),
  id: 'track_id' in entry ? entry.track_id : entry.playlist_id,
  dateSaved: 'dateSaved' in entry ? entry.dateSaved : null
})

const sourceSelector = () => PREFIX

class SavedTracksSagas extends LineupSagas<SavedPageTrack> {
  constructor() {
    super(
      PREFIX,
      savedTracksActions,
      getSavedTracks,
      getTracks,
      keepDateSaved,
      /* removeDeleted */ false,
      sourceSelector
    )
  }
}

function* watchFetchSaves() {
  yield* takeEvery(
    [FETCH_SAVES, FETCH_MORE_SAVES],
    function* (_action: ReturnType<typeof saveActions.fetchSaves>) {
      yield waitForAccount()
      const account: User | null = yield* select(
        accountSelectors.getAccountUser
      )

      if (account?.track_save_count) {
        yield* put(savedTracksActions.setMaxEntries(account.track_save_count))
      }
    }
  )
}

// If a local save is being done and the user is on the saved page route, make sure to update the lineup.
function* watchAddToLibrary() {
  yield* takeEvery(
    [SAVE_TRACK, REPOST_TRACK, purchaseConfirmed.type],
    function* (
      action:
        | ReturnType<typeof tracksSocialActions.saveTrack>
        | ReturnType<typeof tracksSocialActions.repostTrack>
        | ReturnType<typeof purchaseContentActions.purchaseConfirmed>
    ) {
      const { type } = action
      if (
        type === purchaseContentActions.purchaseConfirmed.type &&
        'payload' in action &&
        action.payload.contentType !== PurchaseableContentType.TRACK
      ) {
        return
      }

      const trackId =
        'trackId' in action ? action.trackId : action.payload.contentId
      const tracks = yield* select(getCacheTracks, { ids: [trackId] })

      const track = tracks[trackId]
      if (track.has_current_user_saved && type === SAVE_TRACK) {
        return
      }

      const localSaveUid = makeUid(
        Kind.TRACKS,
        trackId,
        savedTracksActions.prefix
      )

      const newEntry: LineupEntry<Partial<SavedPageTrack>> = {
        uid: localSaveUid,
        kind: Kind.TRACKS,
        id: trackId,
        dateSaved: moment().format()
      }

      let relevantCategory
      if (type === SAVE_TRACK) {
        relevantCategory = LibraryCategory.Favorite
      } else if (type === REPOST_TRACK) {
        relevantCategory = LibraryCategory.Repost
      } else {
        relevantCategory = LibraryCategory.Purchase
      }

      const isTrackAlreadyInLineup = yield* select(
        (state, props) => {
          const lineupUid = getSavedTracksLineupUid(state, props)
          return lineupUid != null
        },
        { id: trackId }
      )
      const currentCategory = yield* select(getCategory, {
        currentTab: SavedPageTabs.TRACKS
      })
      const actionMatchesCurrentCategory = currentCategory === relevantCategory
      if (actionMatchesCurrentCategory && !isTrackAlreadyInLineup) {
        // @ts-ignore - Partial track metadata can be passed here for local saves
        yield* put(savedTracksActions.add(newEntry, trackId, undefined, true))

        const queueSource = yield* select(getSource)
        if (queueSource === QueueSource.SAVED_TRACKS) {
          yield* put(
            queueActions.add({
              entries: [
                {
                  id: trackId,
                  uid: localSaveUid,
                  source: QueueSource.SAVED_TRACKS
                }
              ]
            })
          )
        }
      }
    }
  )
}

function* watchRemoveFromLibrary() {
  yield* takeEvery(
    [UNSAVE_TRACK, UNDO_REPOST_TRACK],
    function* (
      action:
        | ReturnType<typeof tracksSocialActions.unsaveTrack>
        | ReturnType<typeof tracksSocialActions.undoRepostTrack>
    ) {
      const { trackId, type } = action
      const currentCategory = yield* select(getCategory, {
        currentTab: SavedPageTabs.TRACKS
      })

      if (
        (type === UNSAVE_TRACK &&
          currentCategory === LibraryCategory.Favorite) ||
        (type === UNDO_REPOST_TRACK &&
          currentCategory === LibraryCategory.Repost)
      ) {
        const playerUid = yield* select(getPlayerUid)

        const lineupSaveUid = yield* select(getSavedTracksLineupUid, {
          id: trackId
        })
        if (lineupSaveUid) {
          yield* put(savedTracksActions.remove(Kind.TRACKS, lineupSaveUid))
          if (lineupSaveUid !== playerUid) {
            yield* put(queueActions.remove({ uid: lineupSaveUid }))
          }
        }
      }
    }
  )
}

export default function sagas() {
  return new SavedTracksSagas()
    .getSagas()
    .concat(watchAddToLibrary, watchRemoveFromLibrary, watchFetchSaves)
}
