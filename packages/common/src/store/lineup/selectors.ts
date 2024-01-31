import { createSelector } from 'reselect'

import { Kind } from '~/models'
import { getTracksByUid } from '~/store/cache/tracks/selectors'
import { getUsers } from '~/store/cache/users/selectors'
import { Nullable, removeNullable } from '~/utils/typeUtils'

import { LineupState } from '../../models/Lineup'

// Some lineups can have additional properties (T)
// e.g. collections have dateAdded in entries
type LineupSelector<T, State> = (state: State) => LineupState<T>

export const getLineupHasTracks = <T, State>(
  selector: LineupSelector<T, State>,
  state: State
) => {
  const lineup = selector(state)
  return lineup && lineup.entries.length > 0
}

export const getLineupEntries = <T, State>(
  selector: (state: State) => Nullable<LineupState<T>>,
  state: State
) => {
  return selector(state)?.entries
}

export const makeGetTableMetadatas = <T, State>(
  lineupSelector: LineupSelector<T, State>
) => {
  return createSelector(
    lineupSelector,
    getTracksByUid,
    getUsers,
    (lineup, trackUids, users) => {
      let deleted = lineup.deleted
      const entries = lineup.entries
        .map((entry) => {
          const track = trackUids[entry.uid]
          if (track) {
            return {
              ...entry,
              ...track,
              uid: entry.uid,
              followeeReposts: track.followee_reposts
                .map((repost) => ({ ...repost, user: users[repost.user_id] }))
                .filter((repost) => !!repost.user)
            }
          } else if (entry.kind === Kind.EMPTY) {
            return { ...entry, owner_id: null }
          }

          deleted += 1
          return null
        })
        .filter(removeNullable)
        .map((entry) => {
          const ownerId = entry.owner_id
          if (ownerId && ownerId in users) {
            return { ...entry, user: users[ownerId] }
          } else if (entry.kind === Kind.EMPTY) {
            return entry
          }
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

export const makeGetLineupMetadatas = <T, State>(
  lineupSelector: LineupSelector<T, State>
) => {
  return createSelector([lineupSelector], (lineup) => {
    return lineup
  })
}

export const makeGetLineupOrder = <T, State>(
  lineupSelector: LineupSelector<T, State>
) =>
  createSelector([lineupSelector], (lineup) => {
    return lineup.order
  })
