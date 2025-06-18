import { LineupActions, asLineup } from '~/store/lineup/reducer'
import { PREFIX } from '~/store/pages/search-results/lineup/tracks/actions'
import tracksReducer, {
  initialState as initialLineupState
} from '~/store/pages/search-results/lineup/tracks/reducer'

import { Track } from '../../../models'

import { SearchPageState } from './types'

const initialState: SearchPageState = {
  tracks: initialLineupState
}

const tracksLineupReducer = asLineup(PREFIX, tracksReducer)

function reducer(
  state: SearchPageState = initialState,
  action: LineupActions<Track>
) {
  const tracks = tracksLineupReducer(
    state.tracks,
    action as LineupActions<Track>
  )
  return { ...state, tracks }
}

export default reducer
