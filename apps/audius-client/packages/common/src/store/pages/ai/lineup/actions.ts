import { LineupActions } from '../../../lineup/actions'

export const PREFIX = 'AI_TRACKS'

class TracksActions extends LineupActions {
  constructor() {
    super(PREFIX)
  }
}

export const tracksActions = new TracksActions()
