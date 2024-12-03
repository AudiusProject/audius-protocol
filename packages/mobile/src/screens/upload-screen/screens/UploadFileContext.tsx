import type { ReactNode } from 'react'
import { createContext } from 'react'

import type { TrackForUpload } from '@audius/common/store'
import DocumentPicker from 'react-native-document-picker'
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
      const trackFile = await DocumentPicker.pickSingle({
        type: DocumentPicker.types.audio,
        copyTo: 'cachesDirectory'
      })
      return trackFile ? processTrackFile(trackFile) : null
    } catch (error) {
      DocumentPicker.isCancel(error)
      return null
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
