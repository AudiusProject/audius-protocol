  import { Request, Response, NextFunction } from 'express'
  import type { RelayRequestBody } from '@audius/sdk'

export const health = async (req: Request, res: Response) => {
    res.status(200).json({
        isHealthy: true
    })
}
