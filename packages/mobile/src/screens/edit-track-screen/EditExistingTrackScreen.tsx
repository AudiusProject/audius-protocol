import { useCallback } from 'react'

import type { ExtendedTrackMetadata } from '@audius/common'
import {
  cacheTracksActions,
  cacheTracksSelectors,
  SquareSizes
} from '@audius/common'
import { useDispatch, useSelector } from 'react-redux'

import { useNavigation } from 'app/hooks/useNavigation'
import { useRoute } from 'app/hooks/useRoute'
import { useTrackCoverArt } from 'app/hooks/useTrackCoverArt'

import { EditTrackScreen } from './EditTrackScreen'

const { getTrack } = cacheTracksSelectors
const { editTrack } = cacheTracksActions

const messages = {
  title: 'Edit Track'
}

export const EditExistingTrackScreen = () => {
  const { params } = useRoute<'EditTrack'>()
  const { id } = params
  const dispatch = useDispatch()
  const navigation = useNavigation()

  const track = useSelector((state) => getTrack(state, { id }))

  const trackArtwork = useTrackCoverArt({
    id: track?.track_id,
    sizes: track?._cover_art_sizes ?? null,
    size: SquareSizes.SIZE_1000_BY_1000
  })

  const handleSubmit = useCallback(
    (metadata: ExtendedTrackMetadata) => {
      dispatch(editTrack(id, metadata))
      navigation.goBack()
    },
    [dispatch, id, navigation]
  )

  if (!track) return null

  const initialValues = {
    ...track,
    artwork: null,
    trackArtwork
  }

  return (
    <EditTrackScreen
      initialValues={initialValues}
      onSubmit={handleSubmit}
      title={messages.title}
    />
  )
}
