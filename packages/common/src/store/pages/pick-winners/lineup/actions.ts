import { LineupActions } from '../../../../store/lineup/actions'

export const PREFIX = 'PICK_WINNERS_TRACKS'

class TracksActions extends LineupActions {
  constructor() {
    super(PREFIX)
  }
}

export const tracksActions = new TracksActions()
