import Knex from 'knex'
import dotenv from 'dotenv'
const { knex } = Knex

export const initializeDiscoveryDb = (connectionString) => {
  // will first use connection string, next try env var, third default to local pg string
  const connection =
    connectionString ||
    process.env.audius_db_url ||
    'postgresql://postgres:postgres@db:5432/audius_discovery'
  return knex({
    client: 'pg',
    connection
  })
}

// GLOBAL db handles
dotenv.config({ path: './plugins.env' })

export const dp_db = initializeDiscoveryDb()

const shouldToggleOff = (topic) => {
  const { TOGGLE_OFF } = process.env
  const toggledOffTopics = (TOGGLE_OFF || '').split(',')
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
