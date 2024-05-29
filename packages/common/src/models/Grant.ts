import { Nullable } from '~/utils'

import { ID } from './Identifiers'

export type Grant = {
  grantee_address: string
  user_id: Nullable<ID>
  is_revoked: boolean
  is_approved: boolean | null
  created_at: string
  updated_at: string
}
