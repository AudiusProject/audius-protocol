import { useEffect, useState, useCallback } from 'react'

import {
  RandomImage,
  accountSelectors,
  cacheCollectionsActions,
  collectionPageLineupActions as tracksActions,
  imageBlank as placeholderCoverArt,
  EditPlaylistValues,
  cacheCollectionsSelectors,
  useEditPlaylistModal
} from '@audius/common'
import { useGatedContentAccessMap } from '@audius/common/hooks'
import { SquareSizes, Collection, ID } from '@audius/common/models'
import { newCollectionMetadata, Nullable } from '@audius/common/utils'
import { capitalize } from 'lodash'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import IconCamera from 'assets/img/iconCamera.svg'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import EditableRow, { Format } from 'components/groupable-list/EditableRow'
import GroupableList from 'components/groupable-list/GroupableList'
import Grouping from 'components/groupable-list/Grouping'
import TextElement, { Type } from 'components/nav/mobile/TextElement'
import { useTemporaryNavContext } from 'components/nav/store/context'
import TrackList from 'components/track/mobile/TrackList'
import { useCollectionCoverArt } from 'hooks/useCollectionCoverArt'
import useHasChangedRoute from 'hooks/useHasChangedRoute'
import UploadStub from 'pages/profile-page/components/mobile/UploadStub'
import { AppState } from 'store/types'
import { resizeImage } from 'utils/imageProcessingUtil'
import { useSelector } from 'utils/reducer'
import { withNullGuard } from 'utils/withNullGuard'

import styles from './EditPlaylistPage.module.css'
import RemovePlaylistTrackDrawer from './RemovePlaylistTrackDrawer'
const { editPlaylist, orderPlaylist, removeTrackFromPlaylist } =
  cacheCollectionsActions
const { getCollection, getCollectionTracksWithUsers } =
  cacheCollectionsSelectors
const getAccountUser = accountSelectors.getAccountUser

const getMessages = (collectionType: 'album' | 'playlist') => ({
  editPlaylist: `Edit ${capitalize(collectionType)}`,
  randomPhoto: 'Get Random Artwork',
  placeholderName: `My ${collectionType}`,
  placeholderDescription: `Give your ${collectionType} a description`
})

const initialFormFields = {
  artwork: {},
  ...newCollectionMetadata()
}

type EditPlaylistPageProps = ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>

const g = withNullGuard((props: EditPlaylistPageProps) => {
  const { account } = props
  if (account) return { ...props, account }
})

const EditPlaylistPage = g(
  ({ removeTrack, editPlaylist, orderPlaylist, refreshLineup }) => {
    const { data, onClose } = useEditPlaylistModal()
    const { collectionId } = data

    const metadata = useSelector((state) =>
      getCollection(state, { id: collectionId })
    )
    const tracks = useSelector((state) =>
      getCollectionTracksWithUsers(state, { id: collectionId ?? undefined })
    )
    const messages = getMessages(metadata?.is_album ? 'album' : 'playlist')

    // Close the page if the route was changed
    useHasChangedRoute(onClose)
    const initialMetadata = {
      ...(metadata as Collection),
      artwork: { url: '' }
    }

    const [formFields, setFormFields] = useState(
      initialMetadata || initialFormFields
    )

    const [showRemoveTrackDrawer, setShowRemoveTrackDrawer] = useState(false)
    const onDrawerClose = () => setShowRemoveTrackDrawer(false)

    // Holds all tracks to be removed on save
    const [removedTracks, setRemovedTracks] = useState<
      { timestamp: number; trackId: ID }[]
    >([])

    // Holds track to be removed if confirmed
    const [confirmRemoveTrack, setConfirmRemoveTrack] =
      useState<Nullable<{ title: string; trackId: ID; timestamp: number }>>(
        null
      )

    // State to keep track of reordering
    const [reorderedTracks, setReorderedTracks] = useState<number[]>([])
    const [hasReordered, setHasReordered] = useState(false)
    useEffect(() => {
      if (reorderedTracks.length === 0 && tracks && tracks.length !== 0) {
        setReorderedTracks(tracks.map((_: any, i: number) => i))
      }
    }, [setReorderedTracks, reorderedTracks, tracks])

    const existingImage = useCollectionCoverArt(
      formFields.playlist_id,
      formFields._cover_art_sizes,
      SquareSizes.SIZE_1000_BY_1000,
      '' // default
    )
    const [isProcessingImage, setIsProcessingImage] = useState(false)
    const [didChangeArtwork, setDidChangeArtwork] = useState(false)

    const onDropArtwork = useCallback(
      async (selectedFiles: any) => {
        try {
          let file = selectedFiles[0]
          file = await resizeImage(file)
          const url = URL.createObjectURL(file)
          setFormFields((formFields: any) => ({
            ...formFields,
            artwork: { file, url }
          }))
          setDidChangeArtwork(true)
        } catch (err) {
          setFormFields((formFields: any) => ({
            ...formFields,
            artwork: {
              ...(formFields.artwork || {}),
              error: err instanceof Error ? err.message : 'Unknown error'
            }
          }))
        }
      },
      [setFormFields]
    )

    const getRandomArtwork = useCallback(async () => {
      setIsProcessingImage(true)
      const value = await RandomImage.get()
      if (value) {
        await onDropArtwork([value])
      }
      setIsProcessingImage(false)
    }, [onDropArtwork, setIsProcessingImage])

    const onUpdateName = useCallback(
      (name: string) => {
        setFormFields((formFields: any) => ({
          ...formFields,
          playlist_name: name
        }))
      },
      [setFormFields]
    )

    const onUpdateDescription = useCallback(
      (description: string) => {
        setFormFields((formFields: any) => ({ ...formFields, description }))
      },
      [setFormFields]
    )

    const onReorderPlaylist = useCallback(
      (source: number, destination: number) => {
        const reorder = [...reorderedTracks]
        const tmp = reorder[source]
        reorder.splice(source, 1)
        reorder.splice(destination, 0, tmp)

        setHasReordered(true)
        setReorderedTracks(reorder)
      },
      [setHasReordered, reorderedTracks, setReorderedTracks]
    )

    const formatReorder = (
      trackIds: { track: ID; time: number }[],
      reorder: number[]
    ) => {
      return reorder.map((i) => {
        const { track, time } = trackIds[i]
        return {
          id: track,
          time
        }
      })
    }

    const onSave = useCallback(() => {
      // Sanitize description field. Description is required to be present, but can be null
      if (formFields.description === undefined) {
        formFields.description = null
      }
      // Copy the metadata playlist contents so that a reference is not changed between
      // removing tracks, updating track order, and edit playlist
      const playlistTrackIds = [
        ...(metadata?.playlist_contents?.track_ids ?? [])
      ]

      for (const removedTrack of removedTracks) {
        const { playlist_id } = metadata!
        removeTrack(removedTrack.trackId, playlist_id, removedTrack.timestamp)
      }

      if (metadata && formFields.playlist_id) {
        // Edit playlist
        if (hasReordered) {
          // Reorder the playlist and refresh the lineup just in case it's
          // in the view behind the edit playlist page.
          orderPlaylist(
            metadata.playlist_id,
            formatReorder(playlistTrackIds, reorderedTracks)
          )
          // Update the playlist content track_ids so that the editPlaylist
          // optimistically update the cached collection trackIds
          formFields.playlist_contents.track_ids = reorderedTracks.map(
            (idx) => playlistTrackIds[idx]
          )
        }
        refreshLineup()

        const editPlaylistData: any = {
          playlist_name: formFields.playlist_name,
          description: formFields.description,
          artwork: formFields.artwork,
          tracks: formFields.tracks as any,
          track_ids: formFields.playlist_contents.track_ids,
          removedTracks: []
        }

        editPlaylist(metadata.playlist_id, editPlaylistData)

        onClose()
      }
    }, [
      formFields,
      onClose,
      metadata,
      editPlaylist,
      hasReordered,
      reorderedTracks,
      orderPlaylist,
      refreshLineup,
      removeTrack,
      removedTracks
    ])

    /**
     * Stores the track to be removed if confirmed
     * Opens the drawer to confirm removal of the track
     */
    const onRemoveTrack = useCallback(
      (index: number) => {
        if ((metadata?.playlist_contents?.track_ids.length ?? 0) <= index)
          return
        const reorderedIndex = reorderedTracks[index]
        const { playlist_contents } = metadata!
        const { track: trackId, time } =
          playlist_contents.track_ids[reorderedIndex]
        const trackMetadata = tracks?.find(
          (track) => track.track_id === trackId
        )
        if (!trackMetadata) return
        setConfirmRemoveTrack({
          title: trackMetadata.title,
          trackId,
          timestamp: time
        })
        setShowRemoveTrackDrawer(true)
      },
      [
        reorderedTracks,
        setShowRemoveTrackDrawer,
        metadata,
        tracks,
        setConfirmRemoveTrack
      ]
    )

    /**
     * Moves the track to be removed to the removedTracks array
     * Closes the drawer to confirm removal of the track
     */
    const onConfirmRemove = useCallback(() => {
      if (!confirmRemoveTrack) return
      const removeIdx = metadata?.playlist_contents.track_ids.findIndex(
        (t) =>
          t.track === confirmRemoveTrack.trackId &&
          t.time === confirmRemoveTrack.timestamp
      )
      if (removeIdx === -1) return
      setRemovedTracks((removed) =>
        removed.concat({
          trackId: confirmRemoveTrack.trackId,
          timestamp: confirmRemoveTrack.timestamp
        })
      )
      setReorderedTracks((tracks) =>
        tracks.filter((trackIndex) => trackIndex !== removeIdx)
      )
      onDrawerClose()
    }, [metadata, confirmRemoveTrack, setRemovedTracks, setReorderedTracks])

    const setters = useCallback(
      () => ({
        left: (
          <TextElement text='Cancel' type={Type.SECONDARY} onClick={close} />
        ),
        center: messages.editPlaylist,
        right: (
          <TextElement
            text='Save'
            type={Type.PRIMARY}
            isEnabled={!!formFields.playlist_name}
            onClick={onSave}
          />
        )
      }),
      [formFields.playlist_name, messages.editPlaylist, onSave]
    )

    useTemporaryNavContext(setters)

    const trackAccessMap = useGatedContentAccessMap(tracks ?? [])

    // Put together track list if necessary
    let trackList = null
    if (tracks && reorderedTracks.length > 0) {
      trackList = reorderedTracks.map((i) => {
        const t = tracks[i]
        const playlistTrack = metadata?.playlist_contents.track_ids[i]
        const isRemoveActive =
          showRemoveTrackDrawer &&
          t.track_id === confirmRemoveTrack?.trackId &&
          playlistTrack?.time === confirmRemoveTrack?.timestamp
        const { isFetchingNFTAccess, hasStreamAccess } = trackAccessMap[
          t.track_id
        ] ?? { isFetchingNFTAccess: false, hasStreamAccess: true }
        const isLocked = !isFetchingNFTAccess && !hasStreamAccess

        return {
          isLoading: false,
          artistName: t.user.name,
          artistHandle: t.user.handle,
          trackTitle: t.title,
          permalink: t.permalink,
          trackId: t.track_id,
          time: playlistTrack?.time,
          isStreamGated: t.is_stream_gated,
          isDeleted: t.is_delete || !!t.user.is_deactivated,
          isLocked,
          isRemoveActive
        }
      })
    }

    return (
      <div className={styles.editPlaylistPage}>
        <div className={styles.artwork}>
          <DynamicImage
            image={
              didChangeArtwork
                ? formFields.artwork.url
                : existingImage || formFields.artwork.url || placeholderCoverArt
            }
            className={styles.image}
            wrapperClassName={styles.imageWrapper}
          >
            {
              <UploadStub
                onChange={onDropArtwork}
                isProcessing={isProcessingImage}
              />
            }
          </DynamicImage>
          <div className={styles.random} onClick={getRandomArtwork}>
            <IconCamera className={styles.iconCamera} />
            <div className={styles.text}>{messages.randomPhoto}</div>
          </div>
        </div>

        <div className={styles.info}>
          <GroupableList>
            <Grouping>
              <EditableRow
                label='Name'
                format={Format.INPUT}
                initialValue={formFields.playlist_name}
                placeholderValue={messages.placeholderName}
                onChange={onUpdateName}
                maxLength={64}
              />
              <EditableRow
                label='Description'
                format={Format.TEXT_AREA}
                initialValue={formFields?.description ?? undefined}
                placeholderValue={messages.placeholderDescription}
                onChange={onUpdateDescription}
                centerLeftElement={false}
                maxLength={1000}
              />
            </Grouping>
            {trackList && trackList.length > 0 && (
              <Grouping>
                <TrackList
                  tracks={trackList}
                  showDivider
                  noDividerMargin
                  isReorderable
                  onRemove={onRemoveTrack}
                  onReorder={onReorderPlaylist}
                />
              </Grouping>
            )}
          </GroupableList>
        </div>
        <RemovePlaylistTrackDrawer
          isOpen={showRemoveTrackDrawer}
          trackTitle={confirmRemoveTrack?.title}
          onClose={onDrawerClose}
          onConfirm={onConfirmRemove}
        />
      </div>
    )
  }
)

function mapStateToProps(state: AppState) {
  return {
    account: getAccountUser(state)
  }
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    editPlaylist: (id: ID, metadata: EditPlaylistValues) =>
      dispatch(editPlaylist(id, metadata)),
    orderPlaylist: (playlistId: ID, idsAndTimes: any) =>
      dispatch(orderPlaylist(playlistId, idsAndTimes)),
    removeTrack: (trackId: ID, playlistId: ID, timestamp: number) =>
      dispatch(removeTrackFromPlaylist(trackId, playlistId, timestamp)),
    refreshLineup: () => dispatch(tracksActions.fetchLineupMetadatas())
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(EditPlaylistPage)
