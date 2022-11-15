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
export async function checkCIDAccess({
  cid,
  signedDataFromDiscoveryNode,
  signatureFromDiscoveryNode,
  libs,
  logger,
  redis
}: CheckAccessArgs): Promise<CheckAccessResponse> {
  if (!signedDataFromDiscoveryNode || !signatureFromDiscoveryNode) {
    return {
      isValidRequest: false,
      error: 'MissingHeaders',
      shouldCache: false
    }
  }

  const discoveryNodeWallet = recoverWallet(
    signedDataFromDiscoveryNode,
    signatureFromDiscoveryNode
  )
  const isRegisteredDN = await isRegisteredDiscoveryNode({
    discoveryNodeDelegateOwnerWallet: discoveryNodeWallet,
    libs,
    logger,
    redis
  })
  if (!isRegisteredDN) {
    return {
      isValidRequest: false,
      error: 'InvalidDiscoveryNode',
      shouldCache: false
    }
  }

  const {
    cid: copy320CID,
    timestamp: signedTimestamp,
    shouldCache
  } = signedDataFromDiscoveryNode

  if (copy320CID !== cid) {
    return {
      isValidRequest: false,
      error: 'IncorrectCID',
      shouldCache: false
    }
  }

  const hasSignatureExpired = signatureHasExpired(
    signedTimestamp,
    CONTENT_SIGNATURE_MAX_TTL_MS
  )
  if (hasSignatureExpired) {
    logger.info(`content signature for cid ${copy320CID} is too old.`)
    return {
      isValidRequest: false,
      error: 'ExpiredTimestamp',
      shouldCache: false
    }
  }

  return {
    isValidRequest: true,
    error: null,
    shouldCache: !!shouldCache
  }
}
