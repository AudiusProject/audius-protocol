import { Pool as PG } from 'pg'
import { Client as ES } from '@elastic/elasticsearch'
import Cursor from 'pg-cursor'
import _ from 'lodash'
import { indexNames } from './indexNames'
import { BlocknumberCheckpoint } from './types/blocknumber_checkpoint'
import { MsearchResponseItem } from '@elastic/elasticsearch/lib/api/types'

let pool: PG | undefined = undefined
export function dialPg(): PG {
  if (!pool) {
    let connectionString = process.env.audius_db_url
    pool = new PG({ connectionString, application_name: 'es-indexer' })
  }

  return pool
}

export async function queryCursor(sql: string) {
  const client = await dialPg().connect()
  const cursor = client.query(new Cursor(sql))
  return { client, cursor }
}

let esc: ES | undefined = undefined
export function dialEs() {
  if (!esc) {
    let url = process.env.audius_elasticsearch_url
    esc = new ES({ node: url })
  }
  return esc
}

export async function waitForHealthyCluster() {
  return dialEs().cluster.health(
    {
      wait_for_status: 'green',
      timeout: '60s',
    },
    {
      requestTimeout: '60s',
    }
  )
}

export async function ensureSaneCluterSettings() {
  return dialEs().cluster.putSettings({
    persistent: {
      'action.auto_create_index': false,
    },
  })
}

/**
 * Gets the max(blocknumber) from elasticsearch indexes
 * Used for incremental indexing to understand "where we were" so we can load new data from postgres
 */
export async function getBlocknumberCheckpoints(): Promise<BlocknumberCheckpoint> {
  const searches = []

  for (let [tableName, indexName] of Object.entries(indexNames)) {
    searches.push({ index: indexName })
    searches.push({
      size: 0,
      aggs: {
        max_blocknumber: {
          max: {
            field: checkpointField(tableName),
          },
        },
      },
    })
  }

  const multi = await dialEs().msearch({ searches })
  const values = multi.responses.map(
    (r: any) => r.aggregations?.max_blocknumber?.value || 0
  )

  const tableNames = Object.keys(indexNames)
  const checkpoints = _.zipObject(tableNames, values) as BlocknumberCheckpoint
  return checkpoints
}

function checkpointField(tableName: string) {
  switch (tableName) {
    case 'plays':
      return 'created_at'
    default:
      return 'blocknumber'
  }
}
