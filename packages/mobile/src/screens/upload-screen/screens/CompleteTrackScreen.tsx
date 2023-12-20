import { useCallback } from 'react'

import type { ExtendedTrackMetadata, UploadTrack } from '@audius/common'
import { useRoute } from '@react-navigation/native'

import { useNavigation } from 'app/hooks/useNavigation'

import { EditTrackScreen } from '../../edit-track-screen'
import type { UploadParamList, UploadRouteProp } from '../types'

export const messages = {
  title: 'Complete Track',
  done: 'Upload Track'
}

export type CompleteTrackParams = UploadTrack

export const CompleteTrackScreen = () => {
  const { params } = useRoute<UploadRouteProp<'CompleteTrack'>>()
  const { metadata, file } = params
  const navigation = useNavigation<UploadParamList>()

  const handleSubmit = useCallback(
    (metadata: ExtendedTrackMetadata) => {
      navigation.push('UploadingTracks', {
        tracks: [{ file, preview: null, metadata }]
      })
    },
    [navigation, file]
  )

  return (
    <EditTrackScreen
      initialValues={metadata}
      onSubmit={handleSubmit}
      title={messages.title}
      url='/complete-track'
      doneText={messages.done}
    />
  )
}
