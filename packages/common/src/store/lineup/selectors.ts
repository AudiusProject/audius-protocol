import { createSelector } from 'reselect'

import { Nullable } from '~/utils/typeUtils'

import { LineupState } from '../../models/Lineup'

// Some lineups can have additional properties (T)
// e.g. collections have dateAdded in entries
export type LineupSelector<T, State> = (state: State) => LineupState<T>

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
