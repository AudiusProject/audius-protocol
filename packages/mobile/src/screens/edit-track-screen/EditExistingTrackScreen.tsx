import { useCallback } from 'react'

import type { ExtendedTrackMetadata } from '@audius/common'
import { cacheTracksActions, cacheTracksSelectors } from '@audius/common'
import { useDispatch, useSelector } from 'react-redux'

import { useTrackImage } from 'app/components/image/TrackImage'
import { useNavigation } from 'app/hooks/useNavigation'
import { useRoute } from 'app/hooks/useRoute'

import { EditTrackScreen } from './EditTrackScreen'

const { getTrack } = cacheTracksSelectors
const { editTrack } = cacheTracksActions

const messages = {
  title: 'Edit Track',
  save: 'Save Changes'
}

export const EditExistingTrackScreen = () => {
  const { params } = useRoute<'EditTrack'>()
  const { id } = params
  const dispatch = useDispatch()
  const navigation = useNavigation()

  const track = useSelector((state) => getTrack(state, { id }))

  const trackImage = useTrackImage(track)

  const handleSubmit = useCallback(
    (metadata: ExtendedTrackMetadata) => {
      dispatch(editTrack(id, metadata))
      navigation.goBack()
    },
    [dispatch, id, navigation]
  )

  if (!track || !trackImage) return null

  const initialValues = {
    ...track,
    artwork: null,
    trackArtwork: trackImage?.source[2].uri
  }

  return (
    <EditTrackScreen
      initialValues={initialValues}
      onSubmit={handleSubmit}
      title={messages.title}
      doneText={messages.save}
    />
  )
}
