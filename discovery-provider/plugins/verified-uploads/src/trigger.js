import fs from 'fs'

const onNewRowPath = '../on_entity_update.sql'
const onNewRowSql = fs.readFileSync(onNewRowPath, 'utf-8')

export const createOrReplaceTrigger = async (db) => {
  await db.raw(onNewRowSql)
}
