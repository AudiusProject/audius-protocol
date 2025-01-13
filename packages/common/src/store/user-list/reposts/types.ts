import { ID } from '../../../models'

export enum RepostType {
  TRACK = 'TRACK',
  COLLECTION = 'COLLECTION'
}

export type RepostsPageState = {
  id: ID | null
  repostType: RepostType
}

export const REPOSTS_USER_LIST_TAG = 'REPOSTS'
