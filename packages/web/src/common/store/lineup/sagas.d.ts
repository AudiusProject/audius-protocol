import { LineupBaseActions } from '@audius/common/store'

import { Collection, LineupState, LineupTrack } from '@audius/common/models'

export class LineupSagas {
  constructor(
    prefix: string,
    actions: LineupBaseActions,
    lineupSelector: (store: any) => LineupState<any>,
    getTracks: (config: {
      offset: number
      limit: number
      payload: any
    }) => Generator<any, any[] | null, any>,
    retainSelector?: (entry: (LineupTrack | Collection) & { uid: string }) => {
      uid: string
      kind: string
      id: number
      activityTimestamp: string | undefined
    },
    removeDeleted?: boolean,
    sourceSelector?: (state: any) => string
  ): void

  getSagas(): any[]
}
