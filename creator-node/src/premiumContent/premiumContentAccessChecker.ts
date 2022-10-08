import {
  isCIDForPremiumTrack,
  isPremiumContentMatch,
  isRegisteredDiscoveryNode
} from './helpers'
import {
  CheckAccessArgs,
  CheckAccessResponse,
  PremiumContentAccessError
} from './types'
import { recoverWallet } from '../apiSigning'

export class PremiumContentAccessChecker {
  /**
   * Checks that all premium content headers are passed in.
   * Checks that discovery node that generated signature is registered.
   * Checks that signature is not too old.
   * Checks that user requesting the content has access.
   */
  async checkPremiumContentAccess({
    cid,
    premiumContentHeaders,
    libs,
    logger,
    redis
  }: CheckAccessArgs): Promise<CheckAccessResponse> {
    // Only apply premium content middleware logic if file is a premium track file
    const { trackId, isPremium } = await isCIDForPremiumTrack({ cid, redis })
    if (!trackId || !isPremium) {
      return {
        doesUserHaveAccess: true,
        trackId: null,
        isPremium: false,
        error: null
      }
    }

    if (!premiumContentHeaders) {
      return {
        doesUserHaveAccess: false,
        trackId,
        isPremium,
        error: PremiumContentAccessError.MISSING_HEADERS
      }
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
      return {
        doesUserHaveAccess: false,
        trackId,
        isPremium,
        error: PremiumContentAccessError.MISSING_HEADERS
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
        trackId,
        isPremium,
        error: PremiumContentAccessError.INVALID_DISCOVERY_NODE
      }
    }

    const userWallet = await libs.web3Manager.verifySignature(
      signedDataFromUser,
      signatureFromUser
    )
    const isMatch = await isPremiumContentMatch({
      signedDataFromDiscoveryNode,
      userWallet,
      premiumContentId: trackId,
      premiumContentType: 'track',
      logger
    })
    if (!isMatch) {
      return {
        doesUserHaveAccess: false,
        trackId,
        isPremium,
        error: PremiumContentAccessError.FAILED_MATCH
      }
    }

    return {
      doesUserHaveAccess: true,
      trackId,
      isPremium,
      error: null
    }
  }
}
