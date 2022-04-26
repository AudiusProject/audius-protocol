import { IndicesCreateRequest } from '@elastic/elasticsearch/lib/api/types'
import { indexNames } from '../indexNames'
import { BlocknumberCheckpoint } from '../types/blocknumber_checkpoint'
import { SaveDoc } from '../types/docs'
import { BaseIndexer } from './BaseIndexer'

export class SaveIndexer extends BaseIndexer<SaveDoc> {
  tableName = 'saves'
  idColumn = 'save_id'
  indexName = indexNames.saves
  batchSize: number = 20000

  mapping: IndicesCreateRequest = {
    index: indexNames.saves,
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
        user_id: { type: 'keyword' },
        item_key: { type: 'keyword' },
        save_type: { type: 'keyword' },
        save_item_id: { type: 'keyword' },
        is_delete: { type: 'boolean' },
        created_at: { type: 'date' },
      },
    },
  }

  checkpointSql(checkpoint: BlocknumberCheckpoint): string {
    return ` and blocknumber >= ${checkpoint.saves} `
  }

  withRow(row: SaveDoc) {
    row.item_key = `${row.save_type}:${row.save_item_id}`
    row.save_id = `${row.user_id}:${row.item_key}`
  }
}
