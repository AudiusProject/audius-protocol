import { ReactNode, useMemo } from 'react'

import { AppContext } from '@audius/common'
import { useAsync } from 'react-use'

import * as analytics from 'services/analytics'
import { audiusBackendInstance } from 'services/audius-backend/audius-backend-instance'
import { getStorageNodeSelector } from 'services/audius-sdk/storageNodeSelector'
import { localStorage } from 'services/local-storage'
import { remoteConfigInstance } from 'services/remote-config/remote-config-instance'
import { generatePlaylistArtwork } from 'utils/imageProcessingUtil'

type AppContextProviderProps = {
  children: ReactNode
}

export const AppContextProvider = (props: AppContextProviderProps) => {
  const { children } = props

  const { value: storageNodeSelector } = useAsync(getStorageNodeSelector)

  const value = useMemo(
    () => ({
      analytics,
      localStorage,
      storageNodeSelector,
      imageUtils: {
        generatePlaylistArtwork
      },
      audiusBackend: audiusBackendInstance,
      remoteConfig: remoteConfigInstance
    }),
    [storageNodeSelector]
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
