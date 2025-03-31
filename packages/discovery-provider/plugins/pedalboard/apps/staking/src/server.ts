import express, { Application } from 'express'
import cors from 'cors'
import { health } from './routes/health'
import { App } from '@pedalboard/basekit'
import { SharedData } from '.'
import { balance } from './routes/balance'
import { initRound } from './routes/initRound'

export const webServer = (app: App<SharedData>): Application => {
  const expressApp = express()
  expressApp.use(cors())

  expressApp.get('/health', health(app))
  expressApp.get('/balance', balance(app))
  expressApp.get('/init-round', initRound(app))

  return expressApp
}
