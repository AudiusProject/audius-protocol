import { SharedData } from './config'
import { App } from '@pedalboard/basekit'

export type VersionData = {
  // The endpoint of the node in question
  nodeEndpoint: string
  // The node's actual version
  nodeVersion: string
  // Minimum required version for services of the node's type
  minVersion: string
  // Who to slash
  owner: string
  // Did this version check comply?
  ok: boolean
}

export const VERSION_DATA_TABLE_NAME = 'sla_auditor_version_data'

export const createTables = async (app: App<SharedData>) => {
  const db = app.getDnDb()
  const exists = await db.schema.hasTable(VERSION_DATA_TABLE_NAME)
  if (!exists) {
    await db.schema.createTable(VERSION_DATA_TABLE_NAME, (table) => {
      table.increments('id').primary()
      table.string('nodeEndpoint').notNullable().index()
      table.string('nodeVersion').notNullable()
      table.string('minVersion').notNullable()
      table.string('owner').notNullable()
      table.boolean('ok').notNullable()
      table.timestamp('timestamp').defaultTo(db.fn.now()) // Timestamp with default value of current time
    })
  }
}
