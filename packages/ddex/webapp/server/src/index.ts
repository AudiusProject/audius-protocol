import dotenv from 'dotenv'
import path from 'path'
import createS3 from './services/s3'

// Load env vars from ddex package root
dotenv.config({ path: path.join(__dirname, '..', '..', '..', '.env') })

import createApp from './app'
import { dialDb } from './services/dbService'
import { createContext, router } from './trpc'
import * as trpcExpress from '@trpc/server/adapters/express'
import collectionRouters from './routers/collectionRouters'
import makeUploadRouter from './routers/uploadRouter'
import createAppRouter from './routers'
import createSdkService from './services/sdkService'

// TODO: Use superjson

export type AppRouter = ReturnType<typeof createAppRouter>

const port = process.env.DDEX_PORT || 9000

;(async () => {
  try {
    const dbUrl =
      process.env.DDEX_MONGODB_URL ||
      'mongodb://mongo:mongo@localhost:27017/ddex?authSource=admin&replicaSet=rs0'
    await dialDb(dbUrl)
    const sdkService = createSdkService()

    const { app, isAuthedAsAdmin } = createApp(dbUrl, sdkService)

    const s3 = createS3()
    const appRouter = router({
      upload: makeUploadRouter(s3),
      uploads: collectionRouters['uploads'],
      deliveries: collectionRouters['deliveries'],
      pendingReleases: collectionRouters['pending_releases'],
      publishedReleases: collectionRouters['published_releases'],
    })

    app.use(
      '/api/trpc',
      isAuthedAsAdmin,
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
