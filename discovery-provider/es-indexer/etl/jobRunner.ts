import { Client } from '@elastic/elasticsearch'
import { dialEs, queryCursor } from './conn'
import { BlocknumberCheckpoint, Job, JobOptions } from './job'
import Debug from 'debug'
import _ from 'lodash'
import { jobTable } from './etlRunner'
import { indexNames } from './indexNames'

export async function runJob(
  job: Job,
  opts: JobOptions,
  checkpoints: BlocknumberCheckpoint
) {
  const debug = Debug(`fugue:etl:${job.tableName}`)
  const es = dialEs()

  // BOUNCE???
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
  const highBlock = checkpoints[job.tableName]
  debug('starting at blocknumber:', highBlock)

  // etl sql
  let sql = job.sql2(checkpoints)

  // checkpoint expects us to order by the checkpoint field
  sql += ` order by ${checkpointField(job.tableName)} asc `

  // console.log(`
  // ------------------------------------------
  // ${sql}
  // -----------------------------------
  // `)

  const { client, cursor } = await queryCursor(sql)
  const batchSize = job.indexBatchSize || 2000

  while (true) {
    const rows = await cursor.read(batchSize)
    if (rows.length == 0) break

    // previously we'd partition on is_deleted
    // and remove deletes from index
    // but they're still expected to be there...
    // so for now we'll not delete them
    const updates = rows

    // process updates
    if (job.withBatch) {
      const l = `withBatch for ${job.tableName}`
      console.time(l)
      await job.withBatch(updates)
      console.timeEnd(l)
    }

    if (job.forEach) {
      updates.forEach(job.forEach)
    }

    await indexDocs(es, job.indexSettings.index, job.idField, updates)

    rowCounter += rows.length
    debug({
      updates: updates.length,
      rowsProcessed: rowCounter,
    })
  }

  debug(`finished ${job.tableName}`) // total time?
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

  const l = `Index ${docs.length} ${indexName} took`
  // console.time(l)
  const got = await es.bulk({ refresh: true, body })
  // console.timeEnd(l)

  // check errors?
  if (got.errors) {
    console.log('bad news')
    console.log(JSON.stringify(got.items[0]))
  }

  // const { count } = await es.count({ index: indexName });
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

  const multi: any = await dialEs().msearch({ searches })

  const values = multi.responses.map(
    (r: any) => r.aggregations?.max_blocknumber?.value || 0
  )

  const tableNames = Object.keys(indexNames)
  const checkpoints = _.zipObject(tableNames, values) as any
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
