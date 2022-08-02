import { sendResponse, errorResponseServerError, errorResponseForbidden, errorResponseBadRequest } from '../../apiHelpers'
import { recoverWallet } from '../../apiSigning'
import { NextFunction, Request, Response } from 'express'
import { isPremiumContentMatch } from '../../premiumContent/helpers'
import { PremiumContentType } from 'premiumContent/types'
import { getAllRegisteredDNodes } from 'utils'
import type Logger from 'bunyan'

/**
 * Middleware to validate requests to get premium content.
 */
export const premiumContentMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      signedDataFromDiscoveryNode,
      signatureFromDiscoveryNode,
      signedDataFromUser,
      signatureFromUser
    } = req.headers

    if (!signedDataFromDiscoveryNode || !signatureFromDiscoveryNode || !signedDataFromUser || !signatureFromUser) {
      return sendResponse(
        req,
        res,
        errorResponseBadRequest('Missing request headers.')
      )
    }

    const { premiumContentId, premiumContentType } = req.params

    const discoveryNodeWallet = recoverWallet(signedDataFromDiscoveryNode, signatureFromDiscoveryNode)
    if (!isRegisteredDiscoveryNode({
      wallet: discoveryNodeWallet,
      libs: req.app.get('audiusLibs'),
      logger: (req as any).logger as Logger
    })) {
      return sendResponse(
        req,
        res,
        errorResponseForbidden('Failed discovery node signature validation for premium content.')
      )
    }

    const userWallet = recoverWallet(signedDataFromUser, signatureFromUser)
    if (!isPremiumContentMatch({
      signedDataFromDiscoveryNode: JSON.parse(signedDataFromDiscoveryNode as string),
      userWallet,
      premiumContentId: parseInt(premiumContentId),
      premiumContentType: premiumContentType as PremiumContentType
    })) {
      return sendResponse(
        req,
        res,
        errorResponseForbidden('Failed match verification for premium content.')
      )
    }

    next()
  } catch (e) {
    const error = `Could not validate premium content access: ${(e as Error).message}`
    console.error(`${error}.\nError: ${JSON.stringify(e, null, 2)}`)
    return sendResponse(
      req,
      res,
      errorResponseServerError(error)
    )
  }
}

type Service = {
  owner: string,
  endpoint: string,
  spID: number,
  type: 'discovery-node' | 'content-node',
  blockNumber: number,
  delegateOwnerWallet: string
}

function isRegisteredDiscoveryNode({
  wallet,
  libs,
  logger
}: {
  wallet: string,
  libs: any,
  logger: Logger
}) {
  const allRegisteredDiscoveryNodes = getAllRegisteredDNodes(libs, logger)
  return (allRegisteredDiscoveryNodes as Service[]).some((node: Service) => node.delegateOwnerWallet === wallet)
}
