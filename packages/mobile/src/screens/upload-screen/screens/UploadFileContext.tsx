import type { ReactNode } from 'react'
import { createContext } from 'react'

import type { TrackForUpload } from '@audius/common/store'
import {
  pick,
  keepLocalCopy,
  types,
  isErrorWithCode
} from '@react-native-documents/picker'
import { useAsyncFn } from 'react-use'

import { processTrackFile } from '../utils/processTrackFile'

type UploadFileContextType = {}

type UploadFileContextValue = {
  track: TrackForUpload | null
  loading: boolean
  error?: Error
  selectFile: () => void
}

export const UploadFileContext = createContext<UploadFileContextValue>({
  track: null,
  loading: false,
  selectFile: () => {}
})

type UploadFileContextProviderProps = UploadFileContextType & {
  children: ReactNode
}

export const UploadFileContextProvider = (
  props: UploadFileContextProviderProps
) => {
  const { children } = props

  const [{ value, loading, error }, handleSelectFile] = useAsyncFn(async () => {
    try {
      const [trackFile] = await pick({
        type: types.audio,
        copyTo: 'cachesDirectory'
      })

      const [localCopy] = await keepLocalCopy({
        files: [
          { uri: trackFile.uri, fileName: trackFile.name ?? 'track.mp3' }
        ],
        destination: 'cachesDirectory'
      })

      if (localCopy.status === 'success') {
        return processTrackFile({
          ...trackFile,
          localCopyUri: localCopy.localUri
        })
      }
      return null
    } catch (error) {
      if (isErrorWithCode(error) && error.code === 'CANCEL') {
        return null
      }
      throw error
    }
  }, [])

  return (
    <UploadFileContext.Provider
      value={{
        track: value ?? null,
        loading,
        error,
        selectFile: handleSelectFile
      }}
    >
      {children}
    </UploadFileContext.Provider>
  )
}
