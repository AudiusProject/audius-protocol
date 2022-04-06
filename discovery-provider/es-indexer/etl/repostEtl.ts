import { indexNames } from './indexNames'
import { BlocknumberCheckpoint, Job } from './job'

export const repostEtl: Job = {
  tableName: 'reposts',
  idField: 'repost_id',
  indexBatchSize: 10000,
  indexSettings: {
    index: indexNames.reposts,
    settings: {
      index: {
        refresh_interval: '10s',
        number_of_shards: 1,
        number_of_replicas: 0,
      },
    },
    mappings: {
      dynamic: false,
      properties: {
        blocknumber: { type: 'integer' },
        item_key: { type: 'keyword' },
        repost_type: { type: 'keyword' },
        repost_item_id: { type: 'keyword' },
        is_delete: { type: 'boolean' },
        user_id: { type: 'keyword' },
        created_at: { type: 'date' },
      },
    },
  },

  sql2: (checkpoint: BlocknumberCheckpoint) => {
    let sql = `
    -- etl reposts
    select
      blocknumber,
      is_delete,
      user_id,
      repost_type,
      repost_item_id,
      created_at,
      repost_type || ':' || repost_item_id as item_key,
      user_id || ',' || repost_type || ',' || repost_item_id as repost_id
    from reposts
    where is_current = true
    `

    if (checkpoint.reposts > 0) {
      sql += ` and blocknumber >= ${checkpoint.reposts} `
    }

    return sql
  },
}
