import { getRegisteredDiscoveryNodes } from '../utils/getRegisteredDiscoveryNodes'
import { Redis } from 'ioredis'
import type Logger from 'bunyan'

const models = require('../models')
const { QueryTypes } = require('sequelize')

/**
 * Return whether the CID is for a premium track by
 * checking if it's for a 'track' or 'copy320' file
 * and getting the track metadataJSON for the
 * track blockchain id to see if it is premium.
 */
export async function isCIDForPremiumTrack(cid: string): Promise<
  | {
      trackId: null
      isPremium: false
    }
  | {
      trackId: number
      isPremium: boolean
    }
> {
  const result = await models.sequelize.query(
    `select t.* from "Tracks" t, "Files" f
      where f."multihash" = :cid
      and f."type" in ('track', 'copy320')
      and f."trackBlockchainId" = t."blockchainId"`,
    {
      replacements: { cid },
      type: QueryTypes.SELECT
    }
  )
  if (!result.length) {
    return { trackId: null, isPremium: false }
  }

  return {
    trackId: parseInt(result[0].blockchainId),
    isPremium: result[0].metadataJSON.is_premium
  }
}

export async function isRegisteredDiscoveryNode({
  wallet,
  libs,
  logger,
  redis
}: {
  wallet: string
  libs: any
  logger: Logger
  redis: Redis
}) {
  const allRegisteredDiscoveryNodes = await getRegisteredDiscoveryNodes({
    libs,
    logger,
    redis
  })
  return allRegisteredDiscoveryNodes.some(
    (node) => node.delegateOwnerWallet === wallet
  )
}
