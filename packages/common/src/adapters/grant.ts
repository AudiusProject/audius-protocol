import { full } from '@audius/sdk'

import { Grant } from '~/models/Grant'
import { decodeHashId } from '~/utils/hashIds'

export const grantFromSDK = (input: full.Grant): Grant => {
  return {
    grantee_address: input.granteeAddress,
    user_id: decodeHashId(input.userId) ?? null,
    is_revoked: input.isRevoked,
    is_approved: input.isApproved,
    created_at: input.createdAt,
    updated_at: input.updatedAt
  }
}
