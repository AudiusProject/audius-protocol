import {
  Collection,
  LineupBaseActions,
  LineupState,
  LineupTrack
} from '@audius/common'

export class LineupSagas {
  constructor(
    prefix: string,
    actions: LineupBaseActions,
    feedSelector: (store: any) => LineupState<any>,
    getTracks: (config: {
      offset: number
      limit: number
      payload: any
    }) => Generator<any, any[], any>,
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
