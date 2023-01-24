import Knex from 'knex'
import sqlts from '@rmp135/sql-ts'
import { writeFileSync } from 'fs'


async function updateDbTypes(connection: string, name: string) {
  const kpg = Knex({
    client: 'pg',
    connection: connection
  })

  const config = {
    singularTableNames: true,
    tableNameCasing: 'pascal',
    interfaceNameFormat: '${table}Row',
  }
  const tsString = await sqlts.toTypeScript(config, kpg as any)
  console.log(tsString)
  writeFileSync(`${__dirname}/../src/types/${name}.ts`, tsString)
  kpg.destroy()
}

const main = async () => {
  // await updateDbTypes(process.env.DN_DB_URL, 'dn')
  await updateDbTypes('postgresql://postgres:postgres@localhost:5454/audius_discovery?sslmode=disable', 'dn')
  // await updateDbTypes('postgresql://postgres:postgres@discovery-provider:5432/audius_discovery?sslmode=disable', 'dn')
  // await updateDbTypes(process.env.IDENTITY_DB_URL, 'identity')
}

main()
