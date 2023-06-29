import { createContext, useContext } from 'react'

import { StorageNodeSelectorService } from '@audius/sdk'

import { AnalyticsEvent, AllTrackingEvents } from 'models/Analytics'

type AppContextType = {
  analytics: {
    track: (event: AnalyticsEvent, callback?: () => void) => Promise<void>
    make: <T extends AllTrackingEvents>(
      event: T
    ) => {
      eventName: string
      properties: any
    }
  }
  storageNodeSelector?: StorageNodeSelectorService
}

export const AppContext = createContext<AppContextType | null>(null)

export const useAppContext = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppContext has to be used within <AppContext.Provider>')
  }

  return context
}
