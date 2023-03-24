import express, { Express } from 'express'

import { Server as HttpServer } from 'http'
import { router as healthCheckRouter } from './routes/healthCheck'

const DEFAULT_PORT = 6000

export class Server {
  app: Express
  port: number
  httpServer: HttpServer

  constructor(port: number = DEFAULT_PORT) {
    this.app = express()
    this.port = port
  }

  init = async () => {
    this.app.use('/health_check', healthCheckRouter)

    await new Promise((resolve) => {
      this.httpServer = this.app.listen(this.port, () => {
        console.log(`server started at http://localhost:${this.port}`)
        resolve(null)
      })
    })
  }

  close = () => {
    this.httpServer?.close()
    console.log('server closed')
  }
}
