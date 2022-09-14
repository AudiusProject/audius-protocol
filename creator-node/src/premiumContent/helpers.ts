import { signatureHasExpired, recoverWallet } from '../apiSigning'
import {
  PremiumContentAccessError,
  PremiumContentSignatureData,
  PremiumContentType
} from './types'
import { getRegisteredDiscoveryNodes } from '../utils/getRegisteredDiscoveryNodes'
import { Redis } from 'ioredis'
import models from '../models'
import type Logger from 'bunyan'

const PREMIUM_CONTENT_SIGNATURE_MAX_TTL_MS = 6 * 60 * 60 * 1000 // 6 hours

type CheckAccessArgs = {
  cid: string
  premiumContentHeaders: string
  libs: any
  logger: Logger
  redis: Redis
}

export const checkAccess = async ({
  cid,
  premiumContentHeaders,
  libs,
  logger,
  redis
}: CheckAccessArgs): Promise<
  | { doesUserHaveAccess: true; trackId: null; isPremium: false }
  | { doesUserHaveAccess: true; trackId: number; isPremium: boolean }
  | { error: PremiumContentAccessError }
> => {
  // Only apply premium content middleware logic if file is a premium track file
  const { trackId, isPremium } = await isCIDForPremiumTrack(cid)
  if (!isPremium) {
    return { doesUserHaveAccess: true, trackId, isPremium }
  }

  if (!premiumContentHeaders) {
    return { error: PremiumContentAccessError.MISSING_HEADERS }
  }

  const {
    signedDataFromDiscoveryNode,
    signatureFromDiscoveryNode,
    signedDataFromUser,
    signatureFromUser
  } = JSON.parse(premiumContentHeaders)
  if (
    !signedDataFromDiscoveryNode ||
    !signatureFromDiscoveryNode ||
    !signedDataFromUser ||
    !signatureFromUser
  ) {
    return { error: PremiumContentAccessError.MISSING_HEADERS }
  }

  const discoveryNodeWallet = recoverWallet(
    signedDataFromDiscoveryNode,
    signatureFromDiscoveryNode
  )
  const isRegisteredDN = await isRegisteredDiscoveryNode({
    wallet: discoveryNodeWallet,
    libs,
    logger,
    redis
  })
  if (!isRegisteredDN) {
    return { error: PremiumContentAccessError.INVALID_DISCOVERY_NODE }
  }

  const userWallet = await libs.web3Manager.verifySignature(
    signedDataFromUser,
    signatureFromUser
  )
  const isMatch = await isPremiumContentMatch({
    signedDataFromDiscoveryNode,
    userWallet,
    premiumContentId: trackId as number,
    premiumContentType: 'track',
    logger
  })
  if (!isMatch) {
    return { error: PremiumContentAccessError.FAILED_MATCH }
  }

  return { doesUserHaveAccess: true, trackId: trackId as number, isPremium }
}

async function isCIDForPremiumTrack(cid: string): Promise<
  | {
      trackId: null
      isPremium: false
    }
  | {
      trackId: number
      isPremium: boolean
    }
> {
  // @ts-ignore
  const cidFile = await models.File.findOne({
    where: { multihash: cid }
  })
  if (!cidFile || (cidFile.type !== 'track' && cidFile.type !== 'copy320')) {
    return { trackId: null, isPremium: false }
  }

  // @ts-ignore
  const track = await models.Track.findOne({
    where: { blockchainId: cidFile.trackBlockchainId }
  })
  if (!track) {
    return { trackId: null, isPremium: false }
  }

  return {
    trackId: parseInt(track.blockchainId),
    isPremium: track.metadataJSON.is_premium
  }
}

async function isRegisteredDiscoveryNode({
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
async function isPremiumContentMatch({
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
