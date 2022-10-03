import { PremiumContentSignature } from '../models'

import { Nullable } from './typeUtils'

export async function getPremiumContentHeaders(
  premiumContentSignature: Nullable<PremiumContentSignature>,
  signatureFn: (data: string | Buffer) => Promise<string | undefined>
) {
  if (premiumContentSignature) {
    const {
      data: signedDataFromDiscoveryNode,
      signature: signatureFromDiscoveryNode
    } = premiumContentSignature
    const signedDataFromUser = `Premium content user signature at ${Date.now()}`
    const signatureFromUser = await signatureFn(signedDataFromUser)
    return {
      headers: {
        'x-premium-content': JSON.stringify({
          signedDataFromDiscoveryNode: JSON.parse(signedDataFromDiscoveryNode),
          signatureFromDiscoveryNode,
          signedDataFromUser,
          signatureFromUser
        })
      }
    }
  }
  return {}
}
