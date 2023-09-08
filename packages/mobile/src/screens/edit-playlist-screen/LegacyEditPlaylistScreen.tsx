import { useCallback, useMemo } from 'react'

import {
  SquareSizes,
  cacheCollectionsActions,
  collectionPageLineupActions as tracksActions,
  createPlaylistModalUISelectors
} from '@audius/common'
import type { FormikProps } from 'formik'
import { Formik } from 'formik'
import { isEqual } from 'lodash'
import { View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import { FormScreen } from 'app/components/form-screen'
import { useCollectionImage } from 'app/components/image/CollectionImage'
import { TrackList } from 'app/components/track-list'
import { isImageUriSource } from 'app/hooks/useContentNodeImage'
import { makeStyles } from 'app/styles'

import { PlaylistDescriptionInput } from './LegacyPlaylistDescriptionInput'
import { PlaylistImageInput } from './LegacyPlaylistImageInput'
import { PlaylistNameInput } from './LegacyPlaylistNameInput'
const { getMetadata, getTracks } = createPlaylistModalUISelectors
const { editPlaylist, orderPlaylist, removeTrackFromPlaylist } =
  cacheCollectionsActions

const useStyles = makeStyles(({ spacing }) => ({
  footer: {
    paddingBottom: spacing(50)
  }
}))

const EditPlaylistForm = (props: FormikProps<any>) => {
  const { values, handleSubmit, handleReset, setFieldValue } = props
  const styles = useStyles()

  const trackIds = useMemo(
    () => values.tracks?.map(({ track_id }) => track_id),
    [values.tracks]
  )

  const handleReorder = useCallback(
    ({ data, from, to }) => {
      const reorder = [...values.track_ids]
      const tmp = reorder[from]
      reorder.splice(from, 1)
      reorder.splice(to, 0, tmp)

      const reorderedTracks = data.map((id: number) =>
        values.tracks?.find((t) => t.track_id === id)
      )

      setFieldValue('track_ids', reorder)
      setFieldValue('tracks', reorderedTracks)
    },
    [setFieldValue, values.track_ids, values.tracks]
  )

  const handleRemove = useCallback(
    (index: number) => {
      if ((values.track_ids.length ?? 0) <= index) {
        return
      }
      const {
        track: trackId,
        metadata_time: metadataTime,
        time
      } = values.track_ids[index]

      const trackMetadata = values.tracks?.find(
        ({ track_id }) => track_id === trackId
      )

      if (!trackMetadata) return

      setFieldValue('removedTracks', [
        ...values.removedTracks,
        { trackId, timestamp: metadataTime ?? time }
      ])

      const tracks = [...(values.tracks ?? [])]
      tracks.splice(index, 1)

      setFieldValue('tracks', tracks)
    },
    [values.track_ids, values.tracks, values.removedTracks, setFieldValue]
  )

  const header = (
    <>
      <PlaylistImageInput />
      <PlaylistNameInput />
      <PlaylistDescriptionInput />
    </>
  )

  return (
    <FormScreen onSubmit={handleSubmit} onReset={handleReset} goBackOnSubmit>
      {values.tracks ? (
        <TrackList
          hideArt
          isReorderable
          onReorder={handleReorder}
          onRemove={handleRemove}
          ids={trackIds}
          trackItemAction='remove'
          ListHeaderComponent={header}
          ListFooterComponent={<View style={styles.footer} />}
        />
      ) : (
        header
      )}
    </FormScreen>
  )
}

export const LegacyEditPlaylistScreen = () => {
  const playlist = useSelector(getMetadata)
  const dispatch = useDispatch()
  const tracks = useSelector(getTracks)

  const trackImage = useCollectionImage({
    collection: playlist,
    size: SquareSizes.SIZE_1000_BY_1000
  })

  const handleSubmit = useCallback(
    (values: any) => {
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

  const initialValues: any = {
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
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      component={EditPlaylistForm}
    />
  )
}
