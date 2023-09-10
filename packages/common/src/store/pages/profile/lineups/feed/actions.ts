import { LineupActions } from '../../../../../store/lineup/actions'

export const PREFIX = 'PROFILE_FEED'

class FeedActions extends LineupActions {
  constructor() {
    super(PREFIX)
  }
}

export const feedActions = new FeedActions()
