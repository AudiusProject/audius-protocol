import { createCustomAction } from 'typesafe-actions'

import { ID, PremiumContentSignature } from 'models'

export const UPDATE_PREMIUM_CONTENT_SIGNATURES =
  'PREMIUM_CONTENT/UPDATE_PREMIUM_CONTENT_SIGNATURES'

export const updatePremiumContentSignatures = createCustomAction(
  UPDATE_PREMIUM_CONTENT_SIGNATURES,
  (signatureMap: { [id: ID]: PremiumContentSignature }) => ({ signatureMap })
)
