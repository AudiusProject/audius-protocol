import { isRegisteredDiscoveryNode } from './helpers'
import { CheckAccessArgs, CheckAccessResponse } from './types'
import { recoverWallet, signatureHasExpired } from '../apiSigning'

const CONTENT_SIGNATURE_MAX_TTL_MS = 6 * 60 * 60 * 1000 // 6 hours

/**
 * Checks that all content headers are passed in.
 * Checks that discovery node that generated signature is registered.
 * Checks that signature is not too old.
 * Checks that user requesting the content has access.
 */
export async function checkContentAccess({
  cid,
  contentAccessHeaders,
  libs,
  logger,
  redis
}: CheckAccessArgs): Promise<CheckAccessResponse> {
  if (!contentAccessHeaders) {
    return {
      doesUserHaveAccess: false,
      error: 'MissingHeaders',
      shouldCache: false
    }
  }

  const { signedDataFromDiscoveryNode, signatureFromDiscoveryNode } =
    JSON.parse(contentAccessHeaders)
  if (!signedDataFromDiscoveryNode || !signatureFromDiscoveryNode) {
    return {
      doesUserHaveAccess: false,
      error: 'MissingHeaders',
      shouldCache: false
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
      error: 'InvalidDiscoveryNode',
      shouldCache: false
    }
  }

  const {
    cid: copy320CID,
    timestamp: signedTimestamp,
    cache
  } = signedDataFromDiscoveryNode

  if (copy320CID !== cid) {
    return {
      doesUserHaveAccess: false,
      error: 'IncorrectCID',
      shouldCache: false
    }
  }

  const hasSignatureExpired = signatureHasExpired(
    signedTimestamp,
    CONTENT_SIGNATURE_MAX_TTL_MS
  )
  if (hasSignatureExpired) {
    logger.info(`Premium content signature for cid ${copy320CID} is too old.`)
    return {
      doesUserHaveAccess: false,
      error: 'ExpiredTimestamp',
      shouldCache: false
    }
  }

  return {
    doesUserHaveAccess: true,
    error: null,
    shouldCache: !!cache
  }
}
