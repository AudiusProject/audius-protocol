import { Mutex } from 'async-mutex'

import {
  type Middleware,
  type RequestContext,
  type FetchParams
} from '../api/generated/default'
import { ServicesContainer } from '../types'

const SIGNATURE_EXPIRY_MS = 60 * 1000
const MESSAGE_HEADER = 'Encoded-Data-Message'
const SIGNATURE_HEADER = 'Encoded-Data-Signature'

/**
 * Appends request authentication headers to a request.
 * Request headers are computed only every SIGNATURE_EXPIRY_MS or when the value returned by `auth.getAddress()` changes.
 * @param options the middleware options
 */
export const addRequestSignatureMiddleware = ({
  services
}: {
  services: Pick<ServicesContainer, 'audiusWalletClient' | 'logger'>
}): Middleware => {
  const mutex = new Mutex()
  let message: string | null = null
  let signatureAddress: string | null = null
  let signature: string | null = null
  let timestamp: number | null = null

  const getSignature = async () => {
    // Run this exclusively to prevent multiple requests from updating the signature at the same time
    // and reverting to an older signature
    return mutex.runExclusive(async () => {
      const { audiusWalletClient, logger } = services
      const [currentAddress] = await audiusWalletClient.getAddresses()
      const currentTimestamp = new Date().getTime()
      const isExpired =
        !timestamp || timestamp + SIGNATURE_EXPIRY_MS < currentTimestamp

      const needsUpdate =
        !message ||
        !signature ||
        isExpired ||
        signatureAddress !== currentAddress

      if (needsUpdate) {
        try {
          if (!currentAddress) {
            throw new Error('Could not get a wallet address.')
          }
          signatureAddress = currentAddress

          const m = `signature:${currentTimestamp}`

          signature = await audiusWalletClient.signMessage({
            message: m
          })

          // Cache the new signature and message
          message = m
          timestamp = currentTimestamp
        } catch (e) {
          logger.warn(`Unable to add request signature: ${e}`)
        }
      }
      return { message, signature }
    })
  }

  return {
    pre: async (context: RequestContext): Promise<FetchParams> => {
      const { message, signature } = await getSignature()

      // Return the updated request with the signature in the headers
      return !!message && !!signature
        ? {
            ...context,
            url: context.url,
            init: {
              ...context.init,
              headers: {
                ...context.init.headers,
                [MESSAGE_HEADER]: message,
                [SIGNATURE_HEADER]: signature
              }
            }
          }
        : context
    }
  }
}
