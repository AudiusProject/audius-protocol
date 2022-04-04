import { BlocknumberCheckpoint, Job } from './job'

export const followsEtl: Job = {
  tableName: 'follows',
  idField: 'follow_id',
  indexBatchSize: 50000,
  indexSettings: {
    index: 'follows',
    settings: {
      index: {
        number_of_shards: 1,
        number_of_replicas: 0,
      },
    },
    mappings: {
      dynamic: false,
      properties: {
        blocknumber: { type: 'integer' },
        follower_user_id: { type: 'keyword' },
        followee_user_id: { type: 'keyword' },
        created_at: { type: 'date' },
      },
    },
  },

  sql2: (checkpoint: BlocknumberCheckpoint) => {
    let sql = `
    -- etl follows
    select
      follower_user_id || ',' || followee_user_id as follow_id,
      blocknumber,
      follower_user_id,
      followee_user_id,
      created_at
    from follows
    where is_current = true
    `

    if (checkpoint.follows > 0) {
      sql += ` and blocknumber >= ${checkpoint.follows} `
    }

    return sql
  },
}
