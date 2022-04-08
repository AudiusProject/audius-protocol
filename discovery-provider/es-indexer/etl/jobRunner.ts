import { Client } from '@elastic/elasticsearch'
import { dialEs, queryCursor } from './conn'
import { BlocknumberCheckpoint, Job, JobOptions } from './job'
import Debug from 'debug'
import _ from 'lodash'
import { indexNames } from './indexNames'

export async function runJob(
  job: Job,
  opts: JobOptions,
  checkpoints: BlocknumberCheckpoint
) {
  const debug = Debug(`es-indexer:${job.tableName}`)
  const es = dialEs()

  if (opts.drop) {
    debug('dropping index')
    await es.indices.delete(
      { index: job.indexSettings.index },
      { ignore: [404] }
    )
    await es.indices.create(job.indexSettings)
  } else {
    await es.indices.create(job.indexSettings, { ignore: [400] })
  }

  let rowCounter = 0
  let startedAt = new Date()
  const highBlock = checkpoints[job.tableName]
  debug('starting at blocknumber:', highBlock)

  // etl sql
  let sql = job.sql2(checkpoints)

  // checkpoint expects us to order by the checkpoint field
  sql += ` order by ${checkpointField(job.tableName)} asc `

  const { client, cursor } = await queryCursor(sql)
  const batchSize = job.indexBatchSize || 2000

  while (true) {
    const rows = await cursor.read(batchSize)
    if (rows.length == 0) break

    if (job.withBatch) {
      await job.withBatch(rows)
    }

    if (job.forEach) {
      rows.forEach(job.forEach)
    }

    await indexDocs(es, job.indexSettings.index, job.idField, rows)

    rowCounter += rows.length
    debug({
      updates: rows.length,
      rowsProcessed: rowCounter,
    })
  }

  debug({
    message: 'finished',
    rowsProcessed: rowCounter,
    startedAt,
    endedAt: new Date(),
  })
  await cursor.close()
  client.release()
}

export async function indexDocs(
  es: Client,
  indexName: string,
  idField: string,
  docs: any[]
) {
  const body = docs.flatMap((doc) => [
    { index: { _id: doc[idField], _index: indexName } },
    doc,
  ])

  const got = await es.bulk({ body })

  // check errors?
  if (got.errors) {
    console.log('bad news')
    console.log(JSON.stringify(got.items[0]))
  }
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
