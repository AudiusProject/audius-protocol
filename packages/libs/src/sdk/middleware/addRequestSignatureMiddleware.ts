import {
  type Middleware,
  type RequestContext,
  type FetchParams
} from '../api/generated/default'
import { ServicesContainer } from '../types'

const SIGNATURE_EXPIRY_MS = 60 * 1000
const MESSAGE_HEADER = 'Encoded-Data-Message'
const SIGNATURE_HEADER = 'Encoded-Data-Signature'

let message: string | null = null
let signature: string | null = null
let timestamp: number | null = null

/**
 * Appends request authentication headers to a request.
 * Request headers are computed only every SIGNATURE_EXPIRY_MS.
 * @param options the middleware options
 */
export const addRequestSignatureMiddleware = ({
  services
}: {
  services: Pick<ServicesContainer, 'auth' | 'logger'>
}): Middleware => {
  return {
    pre: async (context: RequestContext): Promise<FetchParams> => {
      const { auth, logger } = services
      try {
        const currentTimestamp = new Date().getTime()
        const isExpired =
          !timestamp || timestamp + SIGNATURE_EXPIRY_MS < currentTimestamp

        if (!message || !signature || isExpired) {
          message = `signature:${currentTimestamp}`
          // Add Ethereum-specific prefixes
          const prefix = `\x19Ethereum Signed Message:\n${message.length}`
          const prefixedMessage = prefix + message

          const [sig, recid] = await auth.sign(
            Buffer.from(prefixedMessage, 'utf-8')
          )
          const r = Buffer.from(sig.slice(0, 32)).toString('hex')
          const s = Buffer.from(sig.slice(32, 64)).toString('hex')
          // Add Ethereum- ecovery ID offset
          const v = (recid + 27).toString(16)

          signature = `0x${r}${s}${v}`
          timestamp = currentTimestamp
        }

        return {
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
      } catch (e) {
        // Exepected if the configured auth does not suport signing
        logger.warn(`Unable to add request signature: ${e}`)
        return context
      }
    }
  }
}
