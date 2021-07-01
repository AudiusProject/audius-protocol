import { Moment } from 'moment'

import { ID } from 'models/common/Identifiers'
import { LineupState } from 'models/common/Lineup'

export default interface HistoryPageState {
  tracks: LineupState<{ id: ID; dateListened: Moment }>
}
