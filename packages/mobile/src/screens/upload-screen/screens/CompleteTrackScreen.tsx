import { useCallback, useContext, useMemo, useState } from 'react'

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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const metadata = useMemo(() => track?.metadata, [])

  if (!track) return null

  return (
    <EditTrackScreen
      // ! is fine here bc we render null if track is undefined
      initialValues={{ ...metadata!, isUpload: true }}
      onSubmit={handleSubmit}
      title={messages.title}
      url='/complete-track'
      doneText={messages.done}
    />
  )
}
