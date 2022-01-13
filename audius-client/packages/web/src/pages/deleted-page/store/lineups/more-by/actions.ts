import { LineupActions } from 'store/lineup/actions'

export const PREFIX = 'DELETED_PAGE_MORE_BY'

class MoreByActions extends LineupActions {
  constructor() {
    super(PREFIX)
  }
}

export const moreByActions = new MoreByActions()
