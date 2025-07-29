import { knex } from 'knex'
import { updateTypes } from 'knex-types'

const db = knex({
  client: 'pg',
  connection: 'postgresql://postgres:postgres@localhost:5432/audius_discovery'
})

updateTypes(db, { output: './src/index.ts' }).catch((err) => {
  console.error(err)
  process.exit(1)
})
