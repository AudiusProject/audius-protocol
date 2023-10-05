import { LineupActions } from '../../../../store/lineup/actions'

export const PREFIX = 'EXPLORE_PREMIUM_TRACKS'

class PremiumTracksActions extends LineupActions {
  constructor() {
    super(PREFIX)
  }
}

export const premiumTracksActions = new PremiumTracksActions()
