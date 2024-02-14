import express, { Express, Request, Response } from 'express'

export default function createApp() {
  const app: Express = express()

  app.get('/api/health_check', (_req: Request, res: Response) => {
    res.status(200).send('DDEX publisher is alive!')
  })

  return app
}
