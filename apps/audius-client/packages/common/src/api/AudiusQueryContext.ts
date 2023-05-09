import { createContext } from 'react'

import type { AudiusAPIClient } from 'services/audius-api-client'

export type AudiusQueryContextType = {
  apiClient: AudiusAPIClient
}

export const AudiusQueryContext = createContext<AudiusQueryContextType | null>(
  null
)
