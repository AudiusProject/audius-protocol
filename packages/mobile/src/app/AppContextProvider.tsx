import { useMemo, type ReactNode } from 'react'

import { AppContext } from '@audius/common/context'
import { useAsync } from 'react-use'

import { env } from 'app/env'
import * as analytics from 'app/services/analytics'
import { audiusBackendInstance } from 'app/services/audius-backend-instance'
import { localStorage } from 'app/services/local-storage'
import { remoteConfigInstance } from 'app/services/remote-config/remote-config-instance'
import { audiusSdk } from 'app/services/sdk/audius-sdk'
import { getStorageNodeSelector } from 'app/services/sdk/storageNodeSelector'
import { generatePlaylistArtwork } from 'app/utils/generatePlaylistArtwork'

type AppContextProviderProps = {
  children: ReactNode
}

export const AppContextProvider = (props: AppContextProviderProps) => {
  const { children } = props

  const { value: storageNodeSelector } = useAsync(getStorageNodeSelector)
  const { value: sdk } = useAsync(audiusSdk)

  const value = useMemo(
    () => ({
      analytics,
      storageNodeSelector,
      localStorage,
      getHostUrl: () => {
        return `${env.PUBLIC_PROTOCOL}//${env.PUBLIC_HOSTNAME}`
      },
      imageUtils: { generatePlaylistArtwork },
      audiusSdk: sdk,
      audiusBackend: audiusBackendInstance,
      remoteConfig: remoteConfigInstance
    }),
    [sdk, storageNodeSelector]
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
