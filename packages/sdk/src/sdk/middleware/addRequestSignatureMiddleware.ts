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
  services: Pick<ServicesContainer, 'auth' | 'logger'>
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
      const { auth, logger } = services
      const currentAddress = await auth.getAddress()
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
          signatureAddress = currentAddress

          const m = `signature:${currentTimestamp}`
          const prefix = `\x19Ethereum Signed Message:\n${m.length}`
          const prefixedMessage = prefix + m

          const [sig, recid] = await auth.sign(
            Buffer.from(prefixedMessage, 'utf-8')
          )
          const r = Buffer.from(sig.slice(0, 32)).toString('hex')
          const s = Buffer.from(sig.slice(32, 64)).toString('hex')
          const v = (recid + 27).toString(16)

          // Cache the new signature and message
          message = m
          signature = `0x${r}${s}${v}`
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
