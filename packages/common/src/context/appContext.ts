import { createContext, useContext } from 'react'

import { StorageNodeSelectorService } from '@audius/sdk'

import { AnalyticsEvent, AllTrackingEvents } from 'models/Analytics'
import { AudiusBackend } from 'services/audius-backend'

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
  imageUtils: {
    generatePlaylistArtwork: (
      imageUrls: string[]
    ) => Promise<{ url: string; file: File }>
  }
  audiusBackend: AudiusBackend
}

export const AppContext = createContext<AppContextType | null>(null)

export const useAppContext = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppContext has to be used within <AppContext.Provider>')
  }

  return context
}
