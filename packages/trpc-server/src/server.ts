import 'dotenv/config'

import { createExpressMiddleware } from '@trpc/server/adapters/express'
import cors from 'cors'
import express from 'express'
import swaggerUi from 'swagger-ui-express'
import {
  createOpenApiExpressMiddleware,
  generateOpenApiDocument
} from 'trpc-openapi'
import { appRouter } from './index'
import { createContext } from './trpc'

const app = express()
app.use(cors())

// endpoints
app.use('/trpc', createExpressMiddleware({ router: appRouter, createContext }))
app.use(
  '/rest',
  createOpenApiExpressMiddleware({ router: appRouter, createContext })
)

// OpenAPI schema document
export const openApiDocument = generateOpenApiDocument(appRouter, {
  title: 'Example CRUD API',
  description: 'OpenAPI compliant REST API built using tRPC with Express',
  version: '1.0.0',
  baseUrl: 'http://localhost:2022/rest',
  docsUrl: 'https://docs.audius.co'
})

// Swagger UI
app.use('/', swaggerUi.serve)
app.get('/', swaggerUi.setup(openApiDocument))

const port = 2022
app.listen(port, () => {
  console.log('listening on ', port)
})
