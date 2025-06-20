import {
  pick,
  keepLocalCopy,
  types,
  isErrorWithCode
} from '@react-native-documents/picker'
import { useAsyncFn } from 'react-use'

import { processTrackFile } from '../screens/upload-screen/utils/processTrackFile'

export const useTrackFileSelector = () => {
  const [{ value: track, loading, error }, handleSelectFile] =
    useAsyncFn(async () => {
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
        if (isErrorWithCode(error) && error.code === 'OPERATION_CANCELED') {
          return null
        }
        throw error
      }
    }, [])

  return {
    track,
    loading,
    error,
    selectFile: handleSelectFile
  }
}
