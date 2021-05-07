import express from 'express'
import libs from '../../libs'
import { onStartup } from '../../onStartup'

import { shuffle } from '../utils/helpers'

const LOG_PREFIX = 'servelet: api | '
const DISCOVERY_PROVIDER_REFRESH_INTERVAL = 60 * 1000 // one minute

export const router = express.Router()

let usableDiscoveryProviders: string[] = []

const updateDiscoveryProviders = async () => {
  const services = await libs.discoveryProvider.serviceSelector.findAll()
  console.info(LOG_PREFIX, `Updating internal API hosts ${services}`)
  usableDiscoveryProviders = services
}

onStartup(() => {
  updateDiscoveryProviders()
  setInterval(() => {
    updateDiscoveryProviders()
  }, DISCOVERY_PROVIDER_REFRESH_INTERVAL)
})

/**
 * Gets a randomized list of discovery service endpoints
 */
router.get('/', async (
  req: express.Request,
  res: express.Response) => {
    console.info(LOG_PREFIX, `Serving API hosts: ${usableDiscoveryProviders}`)
    const randomizedEndpoints = shuffle(usableDiscoveryProviders)
    return res.json({ data: randomizedEndpoints })
})
