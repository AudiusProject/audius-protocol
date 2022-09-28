import { signatureHasExpired } from '../apiSigning'
import { PremiumContentSignatureData, PremiumContentType } from './types'
import { getRegisteredDiscoveryNodes } from '../utils/getRegisteredDiscoveryNodes'
import { Redis } from 'ioredis'
import type Logger from 'bunyan'

const models = require('../models')
const { QueryTypes } = require('sequelize')

const PREMIUM_CONTENT_SIGNATURE_MAX_TTL_MS = 6 * 60 * 60 * 1000 // 6 hours

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

type PremiumContentMatchArgs = {
  signedDataFromDiscoveryNode: PremiumContentSignatureData
  userWallet: string
  premiumContentId: number
  premiumContentType: PremiumContentType
  logger?: any
}

/**
 * Verify that DN-signed data timestamp is relatively recent.
 * Verify that id and type (track/playlist) of content requested are same as those in the DN-signed data.
 * Verify that wallet from recovered user signature is the same as that of wallet in the DN-signed data.
 * If all these verifications are successful, then we have a match.
 */
export async function isPremiumContentMatch({
  signedDataFromDiscoveryNode,
  userWallet,
  premiumContentId,
  premiumContentType,
  logger = console
}: PremiumContentMatchArgs) {
  const {
    premium_content_id: signedPremiumContentId,
    premium_content_type: signedPremiumContentType,
    user_wallet: signedUserWallet,
    timestamp: signedTimestamp
  } = signedDataFromDiscoveryNode

  const hasSignatureExpired = signatureHasExpired(
    signedTimestamp,
    PREMIUM_CONTENT_SIGNATURE_MAX_TTL_MS
  )
  if (hasSignatureExpired) {
    logger.info(
      `Premium content signature for id ${premiumContentId} and type ${premiumContentType} is too old.`
    )
    return false
  }

  if (signedPremiumContentId !== premiumContentId) {
    logger.info(
      `Premium content ids do not match for type ${premiumContentType}: ${signedPremiumContentId} (signed) vs ${premiumContentId} (requested).`
    )
    return false
  }

  if (signedPremiumContentType !== premiumContentType) {
    logger.info(
      `Premium content types do not match: ${signedPremiumContentType} (signed) vs ${premiumContentType} (requested).`
    )
    return false
  }

  if (signedUserWallet !== userWallet) {
    logger.info(
      `Premium content user wallets do not match: ${signedUserWallet} (signed) vs ${userWallet} (requested).`
    )
    return false
  }

  return true
}
