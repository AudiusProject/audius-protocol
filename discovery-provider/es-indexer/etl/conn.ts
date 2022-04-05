import 'dotenv/config'

import { Pool as PG } from 'pg'
import { Client as ES } from '@elastic/elasticsearch'
// @ts-ignore
import Cursor from 'pg-cursor'

let pool: PG | undefined = undefined
export function dialPg(): PG {
  if (!pool) {
    let connectionString = process.env.audius_db_url
    pool = new PG({ connectionString, application_name: 'es-indexer' })
  }

  return pool
}

let esc: ES | undefined = undefined
export function dialEs() {
  if (!esc) {
    let url =
      process.env.audius_elasticsearch_url || 'http://elasticsearch:9200'
    esc = new ES({ node: url })
  }
  return esc
}

export async function queryCursor(sql: string) {
  const client = await dialPg().connect()
  const cursor = client.query(new Cursor(sql))
  return { client, cursor }
}
