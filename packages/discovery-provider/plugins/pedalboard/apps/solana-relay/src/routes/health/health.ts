import { Request, Response } from 'express'

export const health = async (_req: Request, res: Response) => {
  res.status(200).json({
    isHealthy: true
  })
}
