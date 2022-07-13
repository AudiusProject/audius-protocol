import { useCallback } from 'react'

import { Collection } from 'common/models/Collection'
import { SquareSizes } from 'common/models/ImageSizes'
import {
  editPlaylist,
  orderPlaylist,
  removeTrackFromPlaylist
} from 'common/store/cache/collections/actions'
import { tracksActions } from 'common/store/pages/collection/lineup/actions'
import {
  getMetadata,
  getTracks
} from 'common/store/ui/createPlaylistModal/selectors'
import { Formik, FormikProps } from 'formik'
import { isEqual } from 'lodash'
import { View } from 'react-native'

import { FormScreen } from 'app/components/form-screen'
import { TrackList } from 'app/components/track-list'
import { useCollectionCoverArt } from 'app/hooks/useCollectionCoverArt'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { makeStyles } from 'app/styles'

import { PlaylistDescriptionInput } from './PlaylistDescriptionInput'
import { PlaylistImageInput } from './PlaylistImageInput'
import { PlaylistNameInput } from './PlaylistNameInput'
import { PlaylistValues } from './types'

const useStyles = makeStyles(({ spacing }) => ({
  footer: {
    paddingBottom: spacing(50)
  }
}))

const EditPlaylistForm = (props: FormikProps<PlaylistValues>) => {
  const { values, handleSubmit, handleReset, setFieldValue } = props
  const styles = useStyles()

  const handleReorder = useCallback(
    ({ data, from, to }) => {
      const reorder = [...values.track_ids]
      const tmp = reorder[from]
      reorder.splice(from, 1)
      reorder.splice(to, 0, tmp)

      setFieldValue('track_ids', reorder)
      setFieldValue('tracks', data)
    },
    [setFieldValue, values.track_ids]
  )

  const handleRemove = useCallback(
    (index: number) => {
      if ((values.track_ids.length ?? 0) <= index) {
        return
      }
      const { track: trackId, time } = values.track_ids[index]

      const trackMetadata = values.tracks?.find(
        ({ track_id }) => track_id === trackId
      )

      if (!trackMetadata) return

      setFieldValue('removedTracks', [
        ...values.removedTracks,
        { trackId, timestamp: time }
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
          tracks={values.tracks}
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

export const EditPlaylistScreen = () => {
  const playlist = useSelectorWeb(getMetadata)
  const dispatchWeb = useDispatchWeb()
  const tracks = useSelectorWeb(getTracks)

  const coverArt = useCollectionCoverArt({
    id: playlist?.playlist_id,
    sizes: playlist?._cover_art_sizes ?? null,
    size: SquareSizes.SIZE_1000_BY_1000
  })

  const handleSubmit = useCallback(
    (values: PlaylistValues) => {
      if (playlist) {
        values.removedTracks.forEach(({ trackId, timestamp }) => {
          dispatchWeb(
            removeTrackFromPlaylist(trackId, playlist.playlist_id, timestamp)
          )
        })
        if (!isEqual(playlist?.playlist_contents.track_ids, values.track_ids)) {
          dispatchWeb(
            orderPlaylist(
              playlist?.playlist_id,
              values.track_ids.map(({ track, time }) => ({ id: track, time }))
            )
          )
        }
        dispatchWeb(
          editPlaylist(playlist.playlist_id, values as unknown as Collection)
        )
        dispatchWeb(tracksActions.fetchLineupMetadatas())
      }
    },
    [dispatchWeb, playlist]
  )

  if (!playlist) return null

  const { playlist_name, description } = playlist

  const initialValues = {
    playlist_name,
    description,
    artwork: { url: coverArt ?? '' },
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
