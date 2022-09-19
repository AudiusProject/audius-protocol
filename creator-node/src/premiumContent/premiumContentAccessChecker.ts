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

export interface AccessChecker {
  checkPremiumContentAccess(args: CheckAccessArgs): Promise<CheckAccessResponse>
}

export class PremiumContentAccessChecker implements AccessChecker {
  async checkPremiumContentAccess({
    cid,
    premiumContentHeaders,
    libs,
    logger,
    redis
  }: CheckAccessArgs): Promise<CheckAccessResponse> {
    // Only apply premium content middleware logic if file is a premium track file
    let { trackId, isPremium } = await isCIDForPremiumTrack(cid)
    if (!isPremium) {
      return { doesUserHaveAccess: true, trackId, isPremium, error: null }
    }

    trackId = trackId as number

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
      premiumContentId: trackId as number,
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
      trackId: trackId as number,
      isPremium,
      error: null
    }
  }
}
