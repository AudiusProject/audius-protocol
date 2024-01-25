import dotenv from 'dotenv'
import path from 'path'

// Load env vars based on NODE_ENV
const envFile = process.env.NODE_ENV === 'stage' ? '.env.stage' : '.env'
dotenv.config({ path: path.resolve(process.cwd(), envFile) })

import createApp from './app'
import { dialDb } from './services/dbService'
import { createContext, router } from './trpc'
import * as trpcExpress from '@trpc/server/adapters/express'
import collectionRouters from './routers/collectionRouters'

// TODO: Use superjson
const appRouter = router(collectionRouters)

export type AppRouter = typeof appRouter

const port = process.env.DDEX_PORT || 3000

;(async () => {
  try {
    const dbUrl =
      process.env.audius_db_url ||
      'mongodb://mongo:mongo@localhost:27017/ddex?authSource=admin'
    await dialDb(dbUrl)

    const app = createApp()

    app.use(
      '/trpc',
      trpcExpress.createExpressMiddleware({
        router: appRouter,
        createContext: (opts) => createContext(opts, {}),
      })
    )

    app.listen(port, () => {
      console.log(`[server]: Server is running at http://localhost:${port}`)
    })
  } catch (error) {
    console.error('Failed to initialize:', error)
    process.exit(1)
  }
})()
