import express from 'express'
import libs from '../../libs'

import { shuffle } from '../utils/helpers'
import { DiscoveryService } from './types'

const E = process.env
const DISCOVERY_PROVIDER_WHITELIST = E.DISCOVERY_PROVIDER_WHITELIST
  ? new Set(E.DISCOVERY_PROVIDER_WHITELIST.split(','))
  : null

export const router = express.Router()

/**
 * Gets a randomized list of discovery service endpoints
 */
router.get('/', async (
  req: express.Request,
  res: express.Response) => {
    const discoveryServices = await libs.ServiceProvider.listDiscoveryProviders()

    const validEndpoints = discoveryServices.map((d: DiscoveryService) => {
      if (DISCOVERY_PROVIDER_WHITELIST && !DISCOVERY_PROVIDER_WHITELIST.has(d.endpoint)) {
        return null
      }
      return d.endpoint
    }).filter(Boolean)

    const randomizedEndpoints = shuffle(validEndpoints)
    return res.json({ data: randomizedEndpoints })
})
