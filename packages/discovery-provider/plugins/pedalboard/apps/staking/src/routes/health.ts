import { NextFunction, Request, Response } from 'express'
import { App } from '@pedalboard/basekit'
import { SharedData } from '..'

export const health = (app: App<SharedData>) => async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.send({ status: 'up', port: app.viewAppData().port })
  next()
}
