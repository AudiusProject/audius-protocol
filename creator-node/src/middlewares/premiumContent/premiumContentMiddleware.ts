import {
  sendResponse,
  errorResponseServerError,
  errorResponseForbidden,
  errorResponseBadRequest
} from '../../apiHelpers'
import { recoverWallet } from '../../apiSigning'
import { NextFunction, Request, Response } from 'express'
import { isPremiumContentMatch } from '../../premiumContent/helpers'
import { PremiumContentType } from '../../premiumContent/types'
import { getAllRegisteredDNodes } from '../../utils'
import type Logger from 'bunyan'
import { Redis } from 'ioredis'

/**
 * Middleware to validate requests to get premium content.
 */
export const premiumContentMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      signedDataFromDiscoveryNode,
      signatureFromDiscoveryNode,
      signedDataFromUser,
      signatureFromUser
    } = req.headers

    if (
      !signedDataFromDiscoveryNode ||
      !signatureFromDiscoveryNode ||
      !signedDataFromUser ||
      !signatureFromUser
    ) {
      return sendResponse(
        req,
        res,
        errorResponseBadRequest('Missing request headers.')
      )
    }

    const logger = (req as any).logger as Logger

    const discoveryNodeWallet = recoverWallet(
      signedDataFromDiscoveryNode,
      signatureFromDiscoveryNode
    )
    const isRegisteredDN = await isRegisteredDiscoveryNode({
      wallet: discoveryNodeWallet,
      libs: req.app.get('audiusLibs'),
      logger,
      redis: req.app.get('redisClient')
    })
    if (!isRegisteredDN) {
      return sendResponse(
        req,
        res,
        errorResponseForbidden(
          'Failed discovery node signature validation for premium content.'
        )
      )
    }

    const { premiumContentId, premiumContentType } = req.params

    const userWallet = recoverWallet(signedDataFromUser, signatureFromUser)
    if (
      !isPremiumContentMatch({
        signedDataFromDiscoveryNode: JSON.parse(
          signedDataFromDiscoveryNode as string
        ),
        userWallet,
        premiumContentId: parseInt(premiumContentId),
        premiumContentType: premiumContentType as PremiumContentType,
        logger
      })
    ) {
      return sendResponse(
        req,
        res,
        errorResponseForbidden('Failed match verification for premium content.')
      )
    }

    next()
  } catch (e) {
    const error = `Could not validate premium content access: ${
      (e as Error).message
    }`
    console.error(`${error}.\nError: ${JSON.stringify(e, null, 2)}`)
    return sendResponse(req, res, errorResponseServerError(error))
  }
}

type Service = {
  owner: string
  endpoint: string
  spID: number
  type: 'discovery-node' | 'content-node'
  blockNumber: number
  delegateOwnerWallet: string
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
  const allRegisteredDiscoveryNodes = await getAllRegisteredDNodes({
    libs,
    logger,
    redis
  })
  return (allRegisteredDiscoveryNodes as Service[]).some(
    (node: Service) => node.delegateOwnerWallet === wallet
  )
}
