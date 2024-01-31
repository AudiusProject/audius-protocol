import { useCallback } from 'react'

import { SquareSizes } from '@audius/common/models'
import type { ExtendedTrackMetadata } from '@audius/common/store'
import { cacheTracksActions, cacheTracksSelectors } from '@audius/common/store'
import { useDispatch, useSelector } from 'react-redux'

import { ModalScreen } from 'app/components/core'
import { useTrackImage } from 'app/components/image/TrackImage'
import { isImageUriSource } from 'app/hooks/useContentNodeImage'
import { useNavigation } from 'app/hooks/useNavigation'
import { useRoute } from 'app/hooks/useRoute'
import { setVisibility } from 'app/store/drawers/slice'

import { EditTrackScreen } from './EditTrackScreen'

const { getTrack } = cacheTracksSelectors
const { editTrack } = cacheTracksActions

const messages = {
  title: 'Edit Track',
  save: 'Save Changes'
}

export const EditTrackModalScreen = () => {
  const { params } = useRoute<'EditTrack'>()
  const { id } = params
  const dispatch = useDispatch()
  const navigation = useNavigation()

  const track = useSelector((state) => getTrack(state, { id }))

  const trackImage = useTrackImage({
    track,
    size: SquareSizes.SIZE_1000_BY_1000
  })

  const handleSubmit = useCallback(
    (metadata: ExtendedTrackMetadata) => {
      if (track?.is_unlisted === true && metadata.is_unlisted === false) {
        dispatch(
          setVisibility({
            drawer: 'ReleaseNowConfirmation',
            visible: true,
            data: {
              trackId: id,
              handleConfirm: () => {
                dispatch(editTrack(id, metadata))
              }
            }
          })
        )
      } else {
        dispatch(editTrack(id, metadata))
      }
      navigation.goBack()
    },
    [dispatch, id, navigation, track?.is_unlisted]
  )

  if (!track) return null

  const initialValues = {
    ...track,
    artwork: null,
    trackArtwork:
      trackImage && isImageUriSource(trackImage.source)
        ? trackImage.source.uri
        : undefined
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
