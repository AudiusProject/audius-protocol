import { QueryClient } from '@tanstack/react-query'
import { Dispatch } from 'redux'

import { ID } from '~/models/Identifiers'

export type BatchContext = {
  sdk: any
  currentUserId: ID | null | undefined
  queryClient: QueryClient
  dispatch: Dispatch
}

export type BatchQuery = {
  id: ID
  context: BatchContext
}
