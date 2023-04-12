import { Knex, knex } from 'knex'

export function getDB(connectionUrl: string): Knex {
  const pg = knex({
    client: 'pg',
    connection: connectionUrl,
    debug: true
  })
  return pg
}
