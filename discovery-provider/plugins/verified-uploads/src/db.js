import Knex from 'knex'
import dotenv from 'dotenv'
import { createOrReplaceTrigger } from './trigger'
const { knex } = Knex

const DB = (url) => {
  const pg = knex({
    client: 'pg',
    connection: url,
    pool: { min: 2, max: 10 },
    // debug: true,
    acquireConnectionTimeout: 120000
  })
  return pg
}

// GLOBAL db handles
dotenv.config()
const { DISCOVERY_DB_URL } = process.env
export const dp_db = DB(DISCOVERY_DB_URL)

createOrReplaceTrigger(dp_db)
  .then((_) => console.log('trigger successfully updated'))
  .catch(console.error)

const shouldToggleOff = (topic) => {
  const { TOGGLE_OFF } = process.env
  const toggledOffTopics = TOGGLE_OFF.split(',')
  const shouldToggle = toggledOffTopics.includes(topic) ? true : false
  if (shouldToggle) {
    console.warn(`toggling off listener for topic '${topic}'`)
  }
  return shouldToggle
}

export default async (topic, callback) => {
  if (shouldToggleOff(topic)) {
    return
  }
  const conn = await dp_db.client.acquireConnection().catch(console.error)
  const sql = `LISTEN ${topic}`
  conn.on('notification', async (msg) => {
    console.log(JSON.stringify(msg))
    await callback(JSON.parse(msg.payload)).catch(console.error)
  })
  conn.on('end', (err) => {
    console.log(err)
    process.exit(1) // have docker restart process
  })
  conn.on('error', (err) => {
    console.log(err)
    process.exit(1) // have docker restart process
  })
  await conn.query(sql).catch(console.error)
  console.log(`listening on topic ${topic}`)
}
