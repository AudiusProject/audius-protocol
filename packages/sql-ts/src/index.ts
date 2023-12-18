import 'dotenv/config'

import Knex from 'knex'
import sqlts from '@rmp135/sql-ts'
import { writeFileSync } from 'fs'

const kpg = Knex({
  client: 'pg',
  connection: process.env.audius_db_url
})

async function updateDbTypes() {
  const config = {
    singularTableNames: true,
    tableNameCasing: 'pascal',
    interfaceNameFormat: '${table}Row'
  }
  const tsString = await sqlts.toTypeScript(config, kpg as any)
  console.log(tsString)
  writeFileSync(`${__dirname}/schema.ts`, tsString)
  kpg.destroy()
}

updateDbTypes()
