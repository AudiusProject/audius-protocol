import type { AudiusSdk } from '@audius/sdk'
import { QueryClient } from '@tanstack/react-query'
import { AnyAction, Dispatch } from 'redux'

import { ID } from '~/models/Identifiers'

export type BatchContext = {
  sdk: AudiusSdk
  currentUserId: ID | null | undefined
  queryClient: QueryClient
  dispatch: Dispatch<AnyAction>
}
