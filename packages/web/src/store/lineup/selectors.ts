import { createSelector } from 'reselect'

import { getTracksByUid } from 'common/store/cache/tracks/selectors'
import { getUsers } from 'common/store/cache/users/selectors'
import { removeNullable } from 'common/utils/typeUtils'
import { LineupState } from 'models/common/Lineup'
import { AppState } from 'store/types'

// Some lineups can have additional properties (T)
// e.g. collections have dateAdded in entries
type LineupSelector<T> = (state: AppState) => LineupState<T>

export const getLineupHasTracks = <T>(
  selector: LineupSelector<T>,
  state: AppState
) => {
  const lineup = selector(state)
  return lineup && lineup.entries.length > 0
}

export const makeGetTableMetadatas = <T>(lineupSelector: LineupSelector<T>) => {
  return createSelector(
    lineupSelector,
    getTracksByUid,
    getUsers,
    (lineup, trackUids, users) => {
      let deleted = lineup.deleted
      const entries = lineup.entries
        .map(entry => {
          const track = trackUids[entry.uid]
          if (track) {
            return {
              ...entry,
              ...track,
              uid: entry.uid,
              followeeReposts: track.followee_reposts
                .map(repost => ({ ...repost, user: users[repost.user_id] }))
                .filter(repost => !!repost.user)
            }
          }

          deleted += 1
          return null
        })
        .filter(removeNullable)
        .map(entry => {
          if (entry.owner_id in users)
            return { ...entry, user: users[entry.owner_id] }
          deleted += 1
          return null
        })
        .filter(removeNullable)

      return {
        ...lineup,
        deleted,
        entries
      }
    }
  )
}

export const makeGetLineupMetadatas = <T>(
  lineupSelector: LineupSelector<T>
) => {
  return createSelector([lineupSelector], lineup => {
    return lineup
  })
}

export const makeGetLineupOrder = <T>(lineupSelector: LineupSelector<T>) =>
  createSelector([lineupSelector], lineup => {
    return lineup.order
  })
