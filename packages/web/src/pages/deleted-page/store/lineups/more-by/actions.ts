import { LineupBaseActions } from '@audius/common/store'

export const PREFIX = 'DELETED_PAGE_MORE_BY'

class MoreByActions extends LineupBaseActions {
  constructor() {
    super(PREFIX)
  }
}

export const moreByActions = new MoreByActions()
