import type { ReactNode } from 'react'
import { createContext } from 'react'

import type { TrackForUpload } from '@audius/common/store'

import { useTrackFileSelector } from 'app/hooks/useTrackFileSelector'

type EditTrackFileContextValue = {
  track: TrackForUpload | null
  loading: boolean
  error?: Error
  selectFile: () => void
}

export const EditTrackFileContext = createContext<EditTrackFileContextValue>({
  track: null,
  loading: false,
  selectFile: () => {}
})

type EditTrackFileContextProviderProps = {
  children: ReactNode
}

export const EditTrackFileContextProvider = (
  props: EditTrackFileContextProviderProps
) => {
  const { children } = props
  const { track, loading, error, selectFile } = useTrackFileSelector()

  return (
    <EditTrackFileContext.Provider
      value={{
        track: track ?? null,
        loading,
        error,
        selectFile
      }}
    >
      {children}
    </EditTrackFileContext.Provider>
  )
}
