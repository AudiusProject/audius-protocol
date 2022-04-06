import { indexNames } from './indexNames'
import { BlocknumberCheckpoint, Job } from './job'

export const savesEtl: Job = {
  tableName: 'saves',
  idField: 'save_id',
  indexBatchSize: 20000,
  indexSettings: {
    index: indexNames.saves,
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
        user_id: { type: 'keyword' },
        item_key: { type: 'keyword' },
        save_type: { type: 'keyword' },
        save_item_id: { type: 'keyword' },
        is_delete: { type: 'boolean' },
        created_at: { type: 'date' },
      },
    },
  },
  sql2: (checkpoint: BlocknumberCheckpoint) => {
    let sql = `
    -- etl saves
    select
      blocknumber,
      is_delete,
      user_id,
      save_type,
      save_item_id,
      created_at,
      save_type || ':' || save_item_id as item_key,
      user_id || ',' || save_type || ',' || save_item_id as save_id
    from saves
    where is_current = true
    `

    if (checkpoint.saves > 0) {
      sql += ` and blocknumber >= ${checkpoint.saves} `
    }

    return sql
  },
}
