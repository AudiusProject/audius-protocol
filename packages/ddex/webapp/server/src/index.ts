import path from 'path'

import * as trpcExpress from '@trpc/server/adapters/express'
import dotenv from 'dotenv'

import createApp from './app'
import createAppRouter from './routers'
import { dialDb } from './services/dbService'
import createS3 from './services/s3'
import createSdkService from './services/sdkService'
import { createContext } from './trpc'

// Load env vars from ddex package root
dotenv.config({ path: path.join(__dirname, '..', '..', '..', '.env') })

// Audius-docker-compose sets the NETWORK env var to the network being run
switch (process.env.NETWORK) {
  case 'stage':
    process.env.NODE_ENV = 'staging'
    break
  case 'prod':
    process.env.NODE_ENV = 'production'
    break
  default:
    process.env.NODE_ENV = 'development'
}

// TODO: Use superjson

export type AppRouter = ReturnType<typeof createAppRouter>

const port = process.env.DDEX_PORT || 9000

;(async () => {
  try {
    const dbUrl =
      process.env.DDEX_MONGODB_URL ||
      'mongodb://mongo:mongo@localhost:27017/ddex?authSource=admin&replicaSet=rs0'
    await dialDb(dbUrl)
    const sdkService = await createSdkService()

    const { app, isAuthedAsAdmin } = createApp(dbUrl, sdkService)

    const s3 = createS3()
    const appRouter = createAppRouter(s3)

    app.use(
      '/api/trpc',
      isAuthedAsAdmin,
      trpcExpress.createExpressMiddleware({
        router: appRouter,
        createContext: (opts) => createContext(opts, {})
      })
    )

    app.listen(port, () => {
      console.info(`[server]: Server is running at http://localhost:${port}`)
    })
  } catch (error) {
    console.error('Failed to initialize:', error)
    process.exit(1)
  }
})()
