import { Moment } from 'moment'

import { ID } from 'common/models/Identifiers'
import { LineupState } from 'models/common/Lineup'

export default interface HistoryPageState {
  tracks: LineupState<{ id: ID; dateListened: Moment }>
}
