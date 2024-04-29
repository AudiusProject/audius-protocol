import { Grant as SDKGrant } from '@audius/sdk'
import { Nullable, decodeHashId } from '~/utils'
import { ID } from './Identifiers'

export type Grant = {
  grantee_address: string
  user_id: Nullable<ID>
  is_revoked: boolean
  is_approved: boolean
  created_at: string
  updated_at: string
}

export const grantFromSDK = (input: SDKGrant): Grant => {
  return {
    grantee_address: input.granteeAddress,
    user_id: decodeHashId(input.userId) ?? null,
    is_revoked: input.isRevoked,
    is_approved: input.isApproved,
    created_at: input.createdAt,
    updated_at: input.updatedAt
  }
}
