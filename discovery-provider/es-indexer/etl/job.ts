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
  indexSettings: any
  sql2: (checkpoints: BlocknumberCheckpoint) => string
  withBatch?: any
  forEach?: any
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

/*

select
  (select max(blocknumber) from users) as users,
  (select max(blocknumber) from tracks) as tracks,
  (select max(blocknumber) from playlists) as playlists,
  (select max(blocknumber) from reposts) as reposts,
  (select max(blocknumber) from saves) as saves,
;

*/
