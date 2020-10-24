import express from 'express'
import libs from '../../libs'

export const router = express.Router()

/**
 * Returns status 200 to check for liveness
 */
router.get('/', async (
  req: express.Request,
  res: express.Response) => {
    const discoveryProvider = libs.discoveryProvider.discoveryProviderEndpoint
    res.json({
      discoveryProvider
    })
})
