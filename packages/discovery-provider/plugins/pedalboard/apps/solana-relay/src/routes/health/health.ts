import { NextFunction, Request, Response } from 'express'

export const health = async (_req: Request, res: Response, next: NextFunction) => {
  res.status(200).json({
    isHealthy: true
  })
  next()
}
