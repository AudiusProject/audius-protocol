import { indexNames } from './indexNames'
import { BlocknumberCheckpoint, Job } from './job'

export const playsEtl: Job = {
  tableName: 'plays',
  idField: 'id',
  indexBatchSize: 50000,
  indexSettings: {
    index: indexNames.plays,
    settings: {
      index: {
        refresh_interval: '10s',
        number_of_shards: 1,
        number_of_replicas: 0,
      },
    },
    mappings: {
      dynamic: false,
      // _source: {
      //   enabled: false,
      // },
      properties: {
        user_id: { type: 'keyword' },
        play_item_id: { type: 'keyword' },
        created_at: { type: 'date' },
      },
    },
  },

  sql2: (checkpoint: BlocknumberCheckpoint) => {
    let sql = `
    -- etl plays
    select
      user_id,
      play_item_id,
      created_at
    from plays
    `

    if (checkpoint.plays > 0) {
      sql += ` where created_at >= ${checkpoint.plays} `
    }

    return sql
  },
}
