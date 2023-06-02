import { useCallback, useMemo } from 'react'

import { deletePlaylistConfirmationModalUIActions } from '@audius/common'
import type { EditPlaylistValues } from '@audius/common'
import type { FormikProps } from 'formik'
import { View, Text } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { useDispatch } from 'react-redux'

import IconClose from 'app/assets/images/iconRemove.svg'
import IconTrash from 'app/assets/images/iconTrash.svg'
import { Divider, TextButton, Tile } from 'app/components/core'
import { TrackList } from 'app/components/track-list'
import { useNavigation } from 'app/hooks/useNavigation'
import { makeStyles } from 'app/styles'

import { TopBarIconButton } from '../app-screen'
import { FormScreen } from '../page-form-screen'

import { PlaylistDescriptionInput } from './PlaylistDescriptionInput'
import { PlaylistImageInput } from './PlaylistImageInput'
import { PlaylistNameInput } from './PlaylistNameInput'

const { requestOpen: openDeletePlaylist } =
  deletePlaylistConfirmationModalUIActions

const messages = {
  screenTitle: 'Edit Playlist',
  reorderTitle: 'Drag Tracks to Reorder',
  deletePlaylist: 'Delete Playlist',
  cancel: 'Cancel',
  save: 'Save'
}

const useStyles = makeStyles(({ palette, spacing, typography }) => ({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing(6)
  },
  titleLabel: {
    fontFamily: typography.fontByWeight.heavy,
    fontSize: typography.fontSize.large,
    color: palette.neutralLight4,
    textTransform: 'uppercase'
  },
  reorderTitle: {
    fontFamily: typography.fontByWeight.demiBold,
    fontSize: typography.fontSize.large,
    color: palette.neutral,
    margin: spacing(4),
    marginTop: spacing(6),
    marginBottom: spacing(2)
  },
  backButton: {
    marginLeft: -6
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: spacing(4)
  },
  bottomButton: {
    flexGrow: 1
  },
  tile: {
    margin: spacing(3),
    marginBottom: spacing(8)
  },
  header: { marginBottom: spacing(4) },
  footer: {},
  deleteButtonRoot: {
    justifyContent: 'center',
    paddingVertical: spacing(4)
  },
  deleteButtonText: {
    fontFamily: typography.fontByWeight.bold,
    fontSize: typography.fontSize.small
  }
}))

export const EditPlaylistForm = (
  props: FormikProps<EditPlaylistValues> & { playlistId: number }
) => {
  const { playlistId, values, handleSubmit, handleReset, setFieldValue } = props
  const styles = useStyles()
  const navigation = useNavigation()
  const dispatch = useDispatch()

  const openDeleteDrawer = useCallback(() => {
    dispatch(openDeletePlaylist({ playlistId }))
    navigation.goBack()
  }, [dispatch, playlistId, navigation])

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
    <View style={styles.header}>
      <PlaylistImageInput />
      <PlaylistNameInput />
      <PlaylistDescriptionInput />
    </View>
  )

  const footer = (
    <View style={styles.footer}>
      <TextButton
        variant='neutralLight4'
        title={messages.deletePlaylist}
        icon={IconTrash}
        iconPosition='left'
        onPress={openDeleteDrawer}
        styles={{
          root: styles.deleteButtonRoot,
          text: styles.deleteButtonText
        }}
      />
    </View>
  )

  return (
    <FormScreen
      onSubmit={handleSubmit}
      onReset={handleReset}
      cancelText={messages.cancel}
      submitText={messages.save}
      goBackOnSubmit
      title={messages.screenTitle}
      topbarLeft={
        <TopBarIconButton
          icon={IconClose}
          style={styles.backButton}
          onPress={navigation.goBack}
        />
      }
    >
      <KeyboardAwareScrollView>
        <Tile style={styles.tile}>
          {header}
          <Divider />
          {values.tracks?.length ? (
            <>
              <View>
                {values.tracks.length ? (
                  <Text style={styles.reorderTitle}>
                    {messages.reorderTitle}
                  </Text>
                ) : null}
              </View>
              <TrackList
                hideArt
                isReorderable
                onReorder={handleReorder}
                onRemove={handleRemove}
                ids={trackIds}
                style={{ marginBottom: 16 }}
                trackItemAction='remove'
              />
              <Divider />
            </>
          ) : null}
          {footer}
        </Tile>
      </KeyboardAwareScrollView>
    </FormScreen>
  )
}
