import { useCallback, useContext, useState } from 'react'

import type { TrackMetadataForUpload } from '@audius/common/store'

import { useNavigation } from 'app/hooks/useNavigation'

import { EditTrackScreen } from '../../edit-track-screen'
import type { UploadParamList } from '../types'

import { UploadFileContext } from './UploadFileContext'

export const messages = {
  title: 'Complete Track',
  done: 'Upload Track'
}

export type CompleteTrackParams = {}

export const CompleteTrackScreen = () => {
  const { track } = useContext(UploadFileContext)
  const [uploadAttempt, setUploadAttempt] = useState(1)
  const navigation = useNavigation<UploadParamList>()

  const handleSubmit = useCallback(
    (metadata: TrackMetadataForUpload) => {
      if (track) {
        navigation.push('UploadingTracks', {
          tracks: [{ file: track.file, preview: null, metadata }],
          uploadAttempt
        })

        // Increment attempt count in case we get sent back here after an error
        setUploadAttempt(uploadAttempt + 1)
      }
    },
    [navigation, track, uploadAttempt]
  )

  if (!track) return null
  const { metadata } = track

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
