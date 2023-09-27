import Knex from 'knex'
import sqlts from '@rmp135/sql-ts'
import { writeFileSync } from 'fs'

const connectionString = process.env.audius_db_url
const kpg = Knex({
  client: 'pg',
  connection: connectionString
})

async function updateDbTypes() {
  const config = {
    singularTableNames: true,
    tableNameCasing: 'pascal',
    columnNameCasing: 'camel',
    interfaceNameFormat: '${table}Row'
  }
  const tsString = await sqlts.toTypeScript(config, kpg as any)
  console.log(tsString)
  writeFileSync(`${__dirname}/../src/db-tables.ts`, tsString)
  kpg.destroy()
}

updateDbTypes()
