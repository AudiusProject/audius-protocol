import { isRegisteredDiscoveryNode } from './helpers'
import { CheckAccessArgs, CheckAccessResponse } from './types'
import { recoverWallet, signatureHasExpired } from '../apiSigning'
import BlacklistManager from '../blacklistManager'

const CONTENT_SIGNATURE_MAX_TTL_MS = 48 * 60 * 60 * 1000 // 48 hours

/**
 * Checks that all content headers are passed in.
 * Checks that discovery node that generated signature is registered.
 * Checks that signature is not too old.
 * Checks that user requesting the content has access.
 */
export async function checkCIDAccess({
  cid,
  data,
  signature,
  libs,
  logger,
  redis
}: CheckAccessArgs): Promise<CheckAccessResponse> {
  const discoveryNodeWallet = recoverWallet(data, signature)
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
    trackId,
    timestamp: signedTimestamp,
    shouldCache
  } = data

  if (copy320CID.replace('\n', '') !== cid) {
    return {
      isValidRequest: false,
      error: 'IncorrectCID',
      shouldCache: false
    }
  }

  // Both the trackBlockchainId and the track CID need to checked whether
  // they are in the blacklist. That's the only reason `trackId`
  // is in the request. Ideally we should only check track CID but
  // that would require another blackfill job on the Blacklist table
  const trackIdBlacklisted = await BlacklistManager.trackIdIsInBlacklist(
    trackId
  )
  const cidBlacklisted = await BlacklistManager.CIDIsInBlacklist(copy320CID)
  const isNotServable = cidBlacklisted || trackIdBlacklisted
  if (isNotServable) {
    return {
      isValidRequest: false,
      error: 'UnservableTrack',
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
    trackId,
    error: null,
    shouldCache: !!shouldCache
  }
}
