import { ReactNode, useMemo } from 'react'

import { AppContext } from '@audius/common'
import { useAsync } from 'react-use'

import * as analytics from 'services/analytics'
import { audiusBackendInstance } from 'services/audius-backend/audius-backend-instance'
import { getStorageNodeSelector } from 'services/audius-sdk/storageNodeSelector'
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
      storageNodeSelector,
      imageUtils: {
        generatePlaylistArtwork
      },
      audiusBackend: audiusBackendInstance
    }),
    [storageNodeSelector]
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
