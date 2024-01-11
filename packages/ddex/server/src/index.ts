import dotenv from 'dotenv'
import path from 'path'

// Load env vars based on NODE_ENV
const envFile = process.env.NODE_ENV === 'stage' ? '.env.stage' : '.env'
dotenv.config({ path: path.resolve(process.cwd(), envFile) })

import createApp from './app'
import { initServices } from './initServices'
import { createContext, router } from './trpc'
import * as trpcExpress from '@trpc/server/adapters/express'
import deliveryRouter from './routers/deliveryRouter'
import releaseRouter from './routers/releaseRouter'

// TODO: Use superjson
const appRouter = router({
  delivery: deliveryRouter,
  release: releaseRouter,
})

export type AppRouter = typeof appRouter

const port = process.env.DDEX_PORT || 8926

;(async () => {
  try {
    const services = await initServices()

    const app = createApp(
      services.sql,
      services.audiusSdk,
      services.xmlProcessorService,
      services.scheduledReleaseService
    )

    app.use(
      '/trpc',
      trpcExpress.createExpressMiddleware({
        router: appRouter,
        createContext: ({ req, res }) => createContext({ req, res }, services),
      })
    )

    app.listen(port, () => {
      console.log(`[server]: Server is running at http://localhost:${port}`)
    })
  } catch (error) {
    console.error('Failed to initialize services:', error)
    process.exit(1)
  }
})()
