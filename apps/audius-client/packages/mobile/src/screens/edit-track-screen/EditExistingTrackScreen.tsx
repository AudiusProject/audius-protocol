import { useCallback } from 'react'

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
import type { FormValues } from './types'

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
    (values: FormValues) => {
      dispatch(editTrack(id, values))
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
