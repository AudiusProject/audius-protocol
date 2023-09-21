import { Router, Request, Response } from 'express'
import { config } from '../../config'
import { getMemStats } from '../../utils/memStats'

const router = Router()

// Mapped to the /mem_stats Endpoint
 router.get("/", async (req: Request, res: Response) => res.json(getMemStats()))

 export { router }
