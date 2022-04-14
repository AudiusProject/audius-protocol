import { dialEs, queryCursor } from './conn'
import { BlocknumberCheckpoint, Job, JobOptions } from './job'
import _ from 'lodash'
import { indexNames } from './indexNames'
import pino from 'pino'

export async function runJob(
  job: Job,
  opts: JobOptions,
  checkpoints: BlocknumberCheckpoint
) {
  const logger = pino({ name: `es-indexer:${job.tableName}` })
  const es = dialEs()

  if (opts.drop) {
    logger.info('dropping index: ' + job.indexSettings.index)
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
  const startingAtBlocknumber = checkpoints[job.tableName]
  logger.info({ startingAtBlocknumber })

  // etl sql
  let sql = job.sql2(checkpoints)

  // checkpoint expects us to order by the checkpoint field
  sql += ` order by ${checkpointField(job.tableName)} asc `

  const { client, cursor } = await queryCursor(sql)
  const batchSize = job.indexBatchSize || 2000

  try {
    while (true) {
      const rows = await cursor.read(batchSize)
      if (rows.length == 0) break

      if (job.withBatch) {
        await job.withBatch(rows)
      }

      if (job.forEach) {
        rows.forEach(job.forEach)
      }

      const body = indexActions(job.indexSettings.index, job.idField, rows)
      const got = await es.bulk({ body })

      if (got.errors) {
        // todo: do a better job picking out error items
        logger.error(got.items[0], `bulk indexing errors`)
      }

      rowCounter += rows.length
      logger.info({
        updates: rows.length,
        rowsProcessed: rowCounter,
      })
    }

    logger.info(
      {
        rowsProcessed: rowCounter,
        startedAt,
        endedAt: new Date(),
      },
      'finished'
    )
  } catch (e) {
    logger.error(e, `while doing job: ${job.tableName}`)
  } finally {
    await cursor.close()
    client.release()
  }
}

function indexActions(indexName: string, idField: string, docs: any[]) {
  return docs.flatMap((doc) => [
    { index: { _id: doc[idField], _index: indexName } },
    doc,
  ])
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
