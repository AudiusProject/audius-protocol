import { useCallback } from 'react'

import { useCollection } from '@audius/common/api'
import { SquareSizes } from '@audius/common/models'
import { AlbumSchema, PlaylistSchema } from '@audius/common/schemas'
import type { EditCollectionValues } from '@audius/common/store'
import { cacheCollectionsActions } from '@audius/common/store'
import { Formik } from 'formik'
import { useDispatch } from 'react-redux'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import { ModalScreen } from 'app/components/core'
import { useCollectionImage } from 'app/components/image/CollectionImage'
import { useNavigation } from 'app/hooks/useNavigation'
import { useRoute } from 'app/hooks/useRoute'
import { isImageUriSource } from 'app/utils/image'

import { EditCollectionNavigator } from './EditCollectionNavigator'

const { editPlaylist } = cacheCollectionsActions

export const EditCollectionScreen = () => {
  const { params } = useRoute<'EditCollection'>()
  const navigation = useNavigation()
  const { data: playlist } = useCollection(params.id)
  const dispatch = useDispatch()

  const trackImage = useCollectionImage({
    collectionId: playlist?.playlist_id,
    size: SquareSizes.SIZE_1000_BY_1000
  })

  const handleSubmit = useCallback(
    (values: EditCollectionValues) => {
      if (playlist) {
        dispatch(editPlaylist(playlist.playlist_id, values))
      }
      navigation.goBack()
    },
    [dispatch, navigation, playlist]
  )

  if (!playlist) return null

  const initialValues: EditCollectionValues = {
    entityType: playlist.is_album ? 'album' : 'playlist',
    ...playlist,
    tracks: [],
    description: playlist.description ?? '',
    artwork: {
      url:
        trackImage && trackImage.source && isImageUriSource(trackImage.source)
          ? (trackImage.source.uri ?? '')
          : ''
    }
  }

  const validationSchema = playlist.is_album ? AlbumSchema : PlaylistSchema

  return (
    <ModalScreen>
      <Formik
        initialValues={initialValues}
        initialStatus={{ imageLoading: false, imageGenerating: false }}
        enableReinitialize
        onSubmit={handleSubmit}
        validationSchema={toFormikValidationSchema(validationSchema)}
      >
        {(formikProps) => (
          <EditCollectionNavigator
            {...formikProps}
            playlistId={playlist.playlist_id}
          />
        )}
      </Formik>
    </ModalScreen>
  )
}
