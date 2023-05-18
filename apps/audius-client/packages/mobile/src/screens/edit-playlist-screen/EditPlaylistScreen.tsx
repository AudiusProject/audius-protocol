import { useCallback } from 'react'

import type { EditPlaylistValues } from '@audius/common'
import {
  SquareSizes,
  cacheCollectionsActions,
  collectionPageLineupActions as tracksActions,
  createPlaylistModalUISelectors
} from '@audius/common'
import { Formik } from 'formik'
import { isEqual } from 'lodash'
import { useDispatch, useSelector } from 'react-redux'

import { useCollectionImage } from 'app/components/image/CollectionImage'
import { isImageUriSource } from 'app/hooks/useContentNodeImage'

import { EditPlaylistNavigator } from './EditPlaylistNavigator'

const { getMetadata, getTracks } = createPlaylistModalUISelectors
const { editPlaylist, orderPlaylist, removeTrackFromPlaylist } =
  cacheCollectionsActions

export const EditPlaylistScreen = () => {
  const playlist = useSelector(getMetadata)
  const dispatch = useDispatch()
  const tracks = useSelector(getTracks)

  const trackImage = useCollectionImage({
    collection: playlist,
    size: SquareSizes.SIZE_1000_BY_1000
  })

  const handleSubmit = useCallback(
    (values: EditPlaylistValues) => {
      if (playlist) {
        dispatch(editPlaylist(playlist.playlist_id, values))
        values.removedTracks.forEach(({ trackId, timestamp }) => {
          dispatch(
            removeTrackFromPlaylist(trackId, playlist.playlist_id, timestamp)
          )
        })
        if (!isEqual(playlist?.playlist_contents.track_ids, values.track_ids)) {
          dispatch(
            orderPlaylist(
              playlist?.playlist_id,
              values.track_ids.map(({ track, time }) => ({ id: track, time }))
            )
          )
        }
        dispatch(tracksActions.fetchLineupMetadatas())
      }
    },
    [dispatch, playlist]
  )

  if (!playlist) return null

  const initialValues: EditPlaylistValues = {
    playlist_name: playlist.playlist_name,
    description: playlist.description,
    artwork: {
      url:
        trackImage && isImageUriSource(trackImage.source)
          ? trackImage.source.uri ?? ''
          : ''
    },
    removedTracks: [],
    tracks,
    track_ids: playlist.playlist_contents.track_ids
  }

  return (
    <Formik initialValues={initialValues} onSubmit={handleSubmit}>
      {(formikProps) => (
        <EditPlaylistNavigator
          {...formikProps}
          playlistId={playlist.playlist_id}
        />
      )}
    </Formik>
  )
}
