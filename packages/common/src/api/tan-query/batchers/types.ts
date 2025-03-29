import type { AudiusSdk } from '@audius/sdk'
import { Dispatch } from 'redux'

import { ID } from '~/models/Identifiers'

import { TypedQueryClient } from '../typed-query-client'

export type BatchContext = {
  sdk: AudiusSdk
  currentUserId: ID | null | undefined
  queryClient: TypedQueryClient
  dispatch: Dispatch
}
