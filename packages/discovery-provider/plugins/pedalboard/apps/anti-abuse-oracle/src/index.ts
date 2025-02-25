import express from 'express'
import { config } from './config'
import { logger } from './logger'
import { Knex, knex } from 'knex'

// Initialize Knex
const db = knex({
  client: 'pg', // Change to 'mysql' or other if needed
  connection: config.discoveryDbConnectionString
})

const main = async () => {
  const { serverHost, serverPort } = config

  const app = express()
  app.get('/attestation/:handle', async (req, res) => {
    const { handle } = req.params

    try {
      // Query database for attestation matching the handle
      const hasPlays = await db('users')
        .join('plays', 'plays.user_id', '=', 'users.user_id')
        .where('users.handle_lc', handle.toLowerCase())
        .first() // Returns undefined if no match
      if (!hasPlays) {
        res.json({ isOk: false })
      }

      res.json({ isOk: true })
    } catch (error) {
      logger.error({ error }, 'Database query failed')
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  app.listen(serverPort, serverHost, () => {
    logger.info({ serverHost, serverPort }, 'server initialized')
  })
}

main().catch((e) => logger.error({ error: e }, 'Fatal error in main!'))
