import { Client } from '@elastic/elasticsearch'
import { IndicesCreateRequest } from '@elastic/elasticsearch/lib/api/types'
import { chunk } from 'lodash'
import pino, { Logger } from 'pino'
import { dialPg, queryCursor, dialEs } from '../conn'
import { BlocknumberCheckpoint } from '../types/blocknumber_checkpoint'

export abstract class BaseIndexer<RowType> {
  tableName: string
  idColumn: string
  indexName: string
  logger: Logger
  rowCounter = 0
  batchSize = 2000
  mapping: IndicesCreateRequest

  private es: Client

  constructor() {
    setTimeout(() => {
      // todo: gross hack to initialize logger with tableName from subclass
      this.logger = pino({
        name: `es-indexer:${this.tableName}`,
        base: undefined,
      })
    }, 1)

    this.es = dialEs()
  }

  baseSelect() {
    return `select * from ${this.tableName} where is_current `
  }

  async createIndex({ drop }: { drop: boolean }) {
    const { es, mapping, logger } = this
    if (drop) {
      logger.info('dropping index: ' + mapping.index)
      await es.indices.delete({ index: mapping.index }, { ignore: [404] })
      await es.indices.create(mapping)
    } else {
      await es.indices.create(mapping, { ignore: [400] })
    }
  }

  async cutoverAlias() {
    const { es, logger, indexName, tableName } = this

    const existingAlias = await es.cat.aliases({
      name: tableName,
      format: 'json',
    })

    const mappedTo = existingAlias[0]?.index

    if (!mappedTo) {
      logger.info({
        action: 'adding index',
      })
      await es.indices.putAlias({
        index: this.indexName,
        name: this.tableName,
      })
    } else if (mappedTo != indexName) {
      logger.info({
        action: 'cutting over index',
        alias: tableName,
        from: mappedTo,
        to: indexName,
      })
      await es.indices.updateAliases({
        actions: [
          {
            remove: {
              alias: tableName,
              index: mappedTo,
            },
          },
          {
            add: {
              alias: tableName,
              index: indexName,
            },
          },
        ],
      })
    } else {
      logger.info({
        actions: 'noop',
        alias: tableName,
        index: indexName,
      })
    }
  }

  async indexIds(ids: Array<number>) {
    if (!ids.length) return
    let sql = this.baseSelect()
    sql += ` and ${this.idColumn} in (${ids.join(',')}) `
    const result = await dialPg().query(sql)
    await this.indexRows(result.rows)
  }

  async catchup(checkpoint: BlocknumberCheckpoint) {
    let sql = this.baseSelect()
    if (checkpoint) {
      sql += this.checkpointSql(checkpoint)
    }
    sql += ` order by blocknumber asc `
    const { client, cursor } = await queryCursor(sql)
    const batchSize = this.batchSize
    while (true) {
      const rows = await cursor.read(batchSize)
      if (rows.length == 0) break
      await this.indexRows(rows)
    }
    await cursor.close()
    client.release()
  }

  abstract checkpointSql(checkpoint: BlocknumberCheckpoint): string

  async indexRows(rows: Array<RowType>) {
    if (!rows.length) return

    // with batch
    await this.withBatch(rows)

    // with row
    rows.forEach((r) => this.withRow(r))

    const chunks = chunk(rows, this.batchSize)

    for (let chunk of chunks) {
      // index to es
      const body = this.buildIndexOps(chunk)
      const got = await dialEs().bulk({ body })

      if (got.errors) {
        // todo: do a better job picking out error items
        this.logger.error(got.items[0], `bulk indexing errors`)
      }

      this.rowCounter += chunk.length
      this.logger.info({
        updates: chunk.length,
        lifetime: this.rowCounter,
      })
    }
  }

  buildIndexOps(rows: RowType[]) {
    return rows.flatMap((row) => [
      { index: { _id: row[this.idColumn], _index: this.indexName } },
      row,
    ])
  }

  async withBatch(rows: Array<RowType>) { }

  withRow(row: RowType) { }
}
