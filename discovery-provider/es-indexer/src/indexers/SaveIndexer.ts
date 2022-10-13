import { IndicesCreateRequest } from '@elastic/elasticsearch/lib/api/types'
import { merge } from 'lodash'
import { indexNames } from '../indexNames'
import { BlocknumberCheckpoint } from '../types/blocknumber_checkpoint'
import { SaveDoc } from '../types/docs'
import { BaseIndexer } from './BaseIndexer'
import { sharedIndexSettings } from './sharedIndexSettings'

export class SaveIndexer extends BaseIndexer<SaveDoc> {
  constructor() {
    super('saves', 'save_id')
    this.batchSize = 20000
  }

  mapping: IndicesCreateRequest = {
    index: indexNames.saves,
    settings: merge(sharedIndexSettings, {}),
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
