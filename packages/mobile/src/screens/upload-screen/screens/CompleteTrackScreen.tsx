import { useCallback, useState } from 'react'

import type {
  TrackForUpload,
  TrackMetadataForUpload
} from '@audius/common/store'
import { useRoute } from '@react-navigation/native'

import { useNavigation } from 'app/hooks/useNavigation'

import { EditTrackScreen } from '../../edit-track-screen'
import type { UploadParamList, UploadRouteProp } from '../types'

export const messages = {
  title: 'Complete Track',
  done: 'Upload Track'
}

export type CompleteTrackParams = TrackForUpload

export const CompleteTrackScreen = () => {
  const { params } = useRoute<UploadRouteProp<'CompleteTrack'>>()
  const { metadata, file } = params
  const [uploadAttempt, setUploadAttempt] = useState(1)
  const navigation = useNavigation<UploadParamList>()

  const handleSubmit = useCallback(
    (metadata: TrackMetadataForUpload) => {
      navigation.push('UploadingTracks', {
        tracks: [{ file, preview: null, metadata }],
        uploadAttempt
      })
      // Increment attempt count in case we get sent back here after an error
      setUploadAttempt(uploadAttempt + 1)
    },
    [navigation, file, uploadAttempt]
  )

  return (
    <EditTrackScreen
      initialValues={{ ...metadata, isUpload: true }}
      onSubmit={handleSubmit}
      title={messages.title}
      url='/complete-track'
      doneText={messages.done}
    />
  )
}
