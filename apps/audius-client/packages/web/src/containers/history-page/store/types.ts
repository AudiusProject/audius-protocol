import { LineupState } from 'models/common/Lineup'
import { ID } from 'models/common/Identifiers'
import { Moment } from 'moment'

export default interface HistoryPageState {
  tracks: LineupState<{ id: ID; dateListened: Moment }>
}
