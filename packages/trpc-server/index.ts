/**
 * This is the API-handler of your app that contains all your API routes.
 * On a bigger app, you will probably want to split this file up into multiple files.
 */
import { initTRPC } from '@trpc/server'
import { createExpressMiddleware } from '@trpc/server/adapters/express'
import cors from 'cors'
import express from 'express'
import swaggerUi from 'swagger-ui-express'
import { z } from 'zod'
import {
  OpenApiMeta,
  createOpenApiExpressMiddleware,
  generateOpenApiDocument
} from 'trpc-openapi'

const app = express()
app.use(cors())

const t = initTRPC.meta<OpenApiMeta>().create()

const publicProcedure = t.procedure
const router = t.router

const appRouter = router({
  greeting: publicProcedure
    .meta({
      openapi: { method: 'GET', path: '/say-hello', tags: ['greeting'] }
    })
    .input(z.object({ name: z.string() }))
    .output(z.object({ greeting: z.string() }))
    .query(({ input }) => {
      return { greeting: `Hello ${input.name}!` }
    }),
  bye: publicProcedure
    .meta({ openapi: { method: 'GET', path: '/say-bye', tags: ['greeting'] } })
    .input(z.object({ name: z.string() }))
    .output(z.object({ greeting: z.string() }))
    .query(({ input }) => {
      return { greeting: `Goodbye ${input.name}!` }
    })
})

// export only the type definition of the API
// None of the actual implementation is exposed to the client
export type AppRouter = typeof appRouter

// Handle incoming tRPC requests
app.use('/api/trpc', createExpressMiddleware({ router: appRouter }))
// Handle incoming OpenAPI requests
app.use('/api', createOpenApiExpressMiddleware({ router: appRouter }))

// Generate OpenAPI schema document
export const openApiDocument = generateOpenApiDocument(appRouter, {
  title: 'Example CRUD API',
  description: 'OpenAPI compliant REST API built using tRPC with Express',
  version: '1.0.0',
  baseUrl: 'http://localhost:2022/api',
  docsUrl: 'https://docs.audius.co',
  tags: ['greeting']
})

// Serve Swagger UI with our OpenAPI schema
app.use('/', swaggerUi.serve)
app.get('/', swaggerUi.setup(openApiDocument))

const port = 2022
app.listen(port, () => {
  console.log('listening on ', port)
})
