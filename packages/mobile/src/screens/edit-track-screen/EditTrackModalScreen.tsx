import { useCallback } from 'react'

import { useTrack } from '@audius/common/api'
import { SquareSizes } from '@audius/common/models'
import type { TrackMetadataForUpload } from '@audius/common/store'
import { cacheTracksActions } from '@audius/common/store'
import { useDispatch } from 'react-redux'

import { ModalScreen } from 'app/components/core'
import { useTrackImage } from 'app/components/image/TrackImage'
import { useNavigation } from 'app/hooks/useNavigation'
import { useRoute } from 'app/hooks/useRoute'
import { isImageUriSource } from 'app/utils/image'

import { EditTrackScreen } from './EditTrackScreen'

const { editTrack } = cacheTracksActions

const messages = {
  title: 'Edit Track',
  save: 'Save'
}

export const EditTrackModalScreen = () => {
  const { params } = useRoute<'EditTrack'>()
  const { id } = params
  const dispatch = useDispatch()
  const navigation = useNavigation()

  const { data: track } = useTrack(id)

  const trackImage = useTrackImage({
    trackId: track?.track_id,
    size: SquareSizes.SIZE_1000_BY_1000
  })

  const handleSubmit = useCallback(
    (metadata: TrackMetadataForUpload) => {
      dispatch(editTrack(id, metadata))
      navigation.navigate('Track', { trackId: id })
    },
    [dispatch, id, navigation]
  )

  if (!track) return null

  const initialValues = {
    ...track,
    artwork: null,
    trackArtwork:
      trackImage && trackImage.source && isImageUriSource(trackImage.source)
        ? trackImage.source.uri
        : undefined,
    isUpload: false,
    isCover:
      track.cover_original_artist != null ||
      track.cover_original_song_title != null
  }

  return (
    <ModalScreen>
      <EditTrackScreen
        initialValues={initialValues}
        onSubmit={handleSubmit}
        title={messages.title}
        doneText={messages.save}
      />
    </ModalScreen>
  )
}
