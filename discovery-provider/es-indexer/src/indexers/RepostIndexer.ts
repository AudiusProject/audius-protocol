import { IndicesCreateRequest } from '@elastic/elasticsearch/lib/api/types'
import { indexNames } from '../indexNames'
import { BlocknumberCheckpoint } from '../types/blocknumber_checkpoint'
import { RepostDoc } from '../types/docs'
import { BaseIndexer } from './BaseIndexer'

export class RepostIndexer extends BaseIndexer<RepostDoc> {
  constructor() {
    super('reposts', 'repost_id')
    this.batchSize = 20000
  }

  mapping: IndicesCreateRequest = {
    index: indexNames.reposts,
    settings: {
      index: {
        number_of_shards: 1,
        number_of_replicas: 0,
        refresh_interval: '5s',
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
  }

  checkpointSql(checkpoint: BlocknumberCheckpoint): string {
    return ` and blocknumber >= ${checkpoint.reposts} `
  }

  withRow(row: RepostDoc) {
    row.item_key = `${row.repost_type}:${row.repost_item_id}`
    row.repost_id = `${row.user_id}:${row.item_key}`
  }
}
