import express from 'express'
import { config } from './config'
import { logger } from './logger'
import { knex } from 'knex'
import { SolanaUtils } from '@audius/sdk'
import bn from 'bn.js'

// Initialize Knex
const db = knex({
  client: 'pg', // Change to 'mysql' or other if needed
  connection: config.discoveryDbConnectionString
})

const main = async () => {
  const { serverHost, serverPort } = config

  const app = express()
  app.use(express.json())
  app.post('/attestation/:handle', async (req, res) => {
    const {
      body: { challengeId, challengeSpecifier, amount },
      params: { handle }
    } = req
    if (
      !challengeId ||
      !challengeSpecifier ||
      amount === null ||
      amount === undefined
    ) {
      res.status(500).json({ error: 'Missing body parameters' })
    }

    const userWalletWithPlays = await db('users')
      .join('plays', 'plays.user_id', '=', 'users.user_id')
      .where('users.handle_lc', handle.toLowerCase())
      .select('users.wallet')
      .first()

    if (!userWalletWithPlays) {
      res.json({ result: false })
    }

    try {
      const bnAmount = SolanaUtils.uiAudioToBNWaudio(amount)
      const identifier = SolanaUtils.constructTransferId(
        challengeId,
        challengeSpecifier
      )
      const toSignStr = SolanaUtils.constructAttestation(
        userWalletWithPlays.wallet,
        bnAmount,
        identifier
      )
      const { signature, recoveryId } = SolanaUtils.signBytes(
        Buffer.from(toSignStr),
        config.privateSignerAddress
      )
      const result = new bn(Uint8Array.of(...signature, recoveryId)).toString(
        'hex'
      )

      res.json({ result })
    } catch (error) {
      logger.error(`Something went wrong: ${error}`)
    }
  })

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
