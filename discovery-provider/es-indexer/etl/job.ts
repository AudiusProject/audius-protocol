import { IndicesCreateRequest } from '@elastic/elasticsearch/lib/api/types'

export type Job = {
  tableName:
    | 'users'
    | 'tracks'
    | 'playlists'
    | 'reposts'
    | 'saves'
    | 'plays'
    | 'follows'
  idField: string
  indexBatchSize?: number
  indexSettings: IndicesCreateRequest
  sql2: (checkpoints: BlocknumberCheckpoint) => string
  withBatch?: (batch: Object[]) => Promise<void>
  forEach?: (doc: Object) => void
}

export type JobOptions = {
  drop?: boolean
  jobs?: string
}

export type BlocknumberCheckpoint = {
  users: number
  tracks: number
  playlists: number
  follows: number
  reposts: number
  saves: number
  plays: any
}
