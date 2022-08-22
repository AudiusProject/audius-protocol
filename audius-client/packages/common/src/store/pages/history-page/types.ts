import { Moment } from 'moment'

import { ID, LineupState } from '../../../models/index'

export interface HistoryPageState {
  tracks: LineupState<{ id: ID; dateListened: Moment }>
}
