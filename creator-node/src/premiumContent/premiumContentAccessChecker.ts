import { isRegisteredDiscoveryNode } from './helpers'
import { CheckAccessArgs, CheckAccessResponse } from './types'
import { recoverWallet, signatureHasExpired } from '../apiSigning'

const PREMIUM_CONTENT_SIGNATURE_MAX_TTL_MS = 6 * 60 * 60 * 1000 // 6 hours

/**
 * Checks that all premium content headers are passed in.
 * Checks that discovery node that generated signature is registered.
 * Checks that signature is not too old.
 * Checks that user requesting the content has access.
 */
export async function checkPremiumContentAccess({
  cid,
  premiumContentHeaders,
  libs,
  logger,
  redis
}: CheckAccessArgs): Promise<CheckAccessResponse> {
  if (!premiumContentHeaders) {
    return {
      doesUserHaveAccess: false,
      error: 'MissingHeaders'
    }
  }

  const { signedDataFromDiscoveryNode, signatureFromDiscoveryNode } =
    JSON.parse(premiumContentHeaders)
  if (!signedDataFromDiscoveryNode || !signatureFromDiscoveryNode) {
    return {
      doesUserHaveAccess: false,
      error: 'MissingHeaders'
    }
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
    return {
      doesUserHaveAccess: false,
      error: 'InvalidDiscoveryNode'
    }
  }

  const { cid: copy320CID, timestamp: signedTimestamp } =
    signedDataFromDiscoveryNode

  if (copy320CID !== cid) {
    return {
      doesUserHaveAccess: false,
      error: 'IncorrectCID'
    }
  }

  const hasSignatureExpired = signatureHasExpired(
    signedTimestamp,
    PREMIUM_CONTENT_SIGNATURE_MAX_TTL_MS
  )
  if (hasSignatureExpired) {
    logger.info(`Premium content signature for cid ${copy320CID} is too old.`)
    return {
      doesUserHaveAccess: false,
      error: 'ExpiredTimestamp'
    }
  }

  return {
    doesUserHaveAccess: true,
    error: null
  }
}
