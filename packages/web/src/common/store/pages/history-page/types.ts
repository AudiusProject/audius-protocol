import { ID } from '@audius/common'
import { Moment } from 'moment'

import { LineupState } from 'common/models/Lineup'

export default interface HistoryPageState {
  tracks: LineupState<{ id: ID; dateListened: Moment }>
}
