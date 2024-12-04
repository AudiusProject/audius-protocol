import { useCallback } from 'react'

import { SquareSizes } from '@audius/common/models'
import { AlbumSchema, PlaylistSchema } from '@audius/common/schemas'
import type { EditCollectionValues } from '@audius/common/store'
import {
  cacheCollectionsActions,
  cacheCollectionsSelectors
} from '@audius/common/store'
import { Formik } from 'formik'
import { useDispatch, useSelector } from 'react-redux'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import { ModalScreen } from 'app/components/core'
import { useCollectionImage } from 'app/components/image/CollectionImage'
import { isImageUriSource } from 'app/hooks/useContentNodeImage'
import { useNavigation } from 'app/hooks/useNavigation'
import { useRoute } from 'app/hooks/useRoute'

import { EditCollectionNavigator } from './EditCollectionNavigator'

const { editPlaylist } = cacheCollectionsActions
const { getCollection } = cacheCollectionsSelectors

export const EditCollectionScreen = () => {
  const { params } = useRoute<'EditCollection'>()
  const navigation = useNavigation()
  const playlist = useSelector((state) =>
    getCollection(state, { id: params.id })
  )
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
          ? trackImage.source.uri ?? ''
          : ''
    }
  }

  const validationSchema = playlist.is_album ? AlbumSchema : PlaylistSchema

  return (
    <ModalScreen>
      <Formik
        initialValues={initialValues}
        initialStatus={{ imageLoading: false, imageGenerating: false }}
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
