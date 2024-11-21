import { useContext } from 'react'

import { useGetTrackById } from '@audius/common/api'
import {
  ShareSource,
  RepostSource,
  FavoriteSource,
  PlayableType,
  ID
} from '@audius/common/models'
import { trpc } from '@audius/common/services'
import {
  accountSelectors,
  cacheCollectionsActions,
  cacheTracksActions,
  collectionPageSelectors,
  tracksSocialActions,
  addToCollectionUIActions,
  playbackPositionActions,
  playbackPositionSelectors,
  CommonState,
  artistPickModalActions,
  useDeleteTrackConfirmationModal
} from '@audius/common/store'
import { Genre, Nullable, route } from '@audius/common/utils'
import { PopupMenuItem } from '@audius/harmony'
import { push as pushRoute } from 'connected-react-router'
import { connect, useDispatch, useSelector } from 'react-redux'
import { Dispatch } from 'redux'

import * as embedModalActions from 'components/embed-modal/store/actions'
import { ToastContext } from 'components/toast/ToastContext'
import { AppState } from 'store/types'
import { albumPage } from 'utils/route'

const { profilePage } = route
const { requestOpen: openAddToCollection } = addToCollectionUIActions
const { saveTrack, unsaveTrack, repostTrack, undoRepostTrack, shareTrack } =
  tracksSocialActions
const { getCollectionId } = collectionPageSelectors
const { addTrackToPlaylist } = cacheCollectionsActions
const { deleteTrack } = cacheTracksActions
const { getAccountOwnedPlaylists, getUserId } = accountSelectors
const { clearTrackPosition, setTrackPosition } = playbackPositionActions
const { getUserTrackPositions } = playbackPositionSelectors

const messages = {
  addToAlbum: 'Add To Album',
  addToPlaylist: 'Add To Playlist',
  copiedToClipboard: 'Copied To Clipboard!',
  deleteTrack: 'Delete Track',
  editTrack: 'Edit Track',
  embed: 'Embed',
  favorite: 'Favorite',
  repost: 'Repost',
  reposted: 'Reposted!',
  setArtistPick: 'Set as Artist Pick',
  share: 'Share',
  undoRepost: 'Undo Repost',
  unfavorite: 'Unfavorite',
  unreposted: 'Un-Reposted!',
  unsetArtistPick: 'Unset as Artist Pick',
  visitArtistPage: 'Visit Artist Page',
  visitAlbumPage: 'Visit Album Page',
  visitTrackPage: 'Visit Track Page',
  visitEpisodePage: 'Visit Episode Page',
  markAsPlayed: 'Mark as Played',
  markedAsPlayed: 'Marked as Played',
  markAsUnplayed: 'Mark as Unplayed',
  markedAsUnplayed: 'Marked as Unplayed'
}

export type OwnProps = {
  children: (items: PopupMenuItem[]) => JSX.Element
  extraMenuItems?: PopupMenuItem[]
  handle: string
  includeAddToAlbum?: boolean
  includeAddToPlaylist?: boolean
  includeArtistPick?: boolean
  includeDelete?: boolean
  includeEdit?: boolean
  ddexApp?: string | null
  includeEmbed?: boolean
  includeFavorite?: boolean
  includeRepost?: boolean
  includeShare?: boolean
  includeAlbumPage?: boolean
  includeTrackPage?: boolean
  isArtistPick?: boolean
  isDeleted?: boolean
  isFavorited?: boolean
  isOwner?: boolean
  isOwnerDeactivated?: boolean
  isReposted?: boolean
  isUnlisted?: boolean
  trackId: ID
  trackTitle: string
  genre?: Genre
  trackPermalink: string
  type: 'track'
}

export type TrackMenuProps = OwnProps &
  ReturnType<typeof mapDispatchToProps> &
  ReturnType<typeof mapStateToProps>

const TrackMenu = (props: TrackMenuProps) => {
  const { trackPermalink, goToRoute } = props
  const { toast } = useContext(ToastContext)
  const dispatch = useDispatch()
  const currentUserId = useSelector(getUserId)
  const { onOpen: openDeleteTrackConfirmation } =
    useDeleteTrackConfirmationModal()

  const { data: track } = useGetTrackById({ id: props.trackId })

  const onDeleteTrack = (trackId: Nullable<number>) => {
    if (!trackId) return
    openDeleteTrackConfirmation({
      confirmCallback: () => {
        dispatch(deleteTrack(trackId))
      }
    })
  }

  const onEditTrack = (trackId: Nullable<number>) => {
    if (!trackId) return
    const permalink = trackPermalink || track?.permalink
    permalink && goToRoute(`${permalink}/edit`)
  }

  const trackPlaybackPositions = useSelector((state: CommonState) =>
    getUserTrackPositions(state, { userId: currentUserId })
  )

  const getMenu = () => {
    const {
      extraMenuItems,
      goToRoute,
      handle,
      includeAddToAlbum,
      includeAddToPlaylist,
      includeArtistPick,
      includeDelete,
      includeEdit,
      ddexApp,
      includeEmbed,
      includeFavorite,
      includeRepost,
      includeShare,
      includeAlbumPage,
      includeTrackPage,
      isArtistPick,
      isDeleted,
      isFavorited,
      isOwner,
      isOwnerDeactivated,
      isReposted,
      isUnlisted,
      openAddToCollectionModal,
      openEmbedModal,
      repostTrack,
      saveTrack,
      setArtistPick,
      shareTrack,
      trackId,
      trackTitle,
      trackPermalink,
      genre,
      undoRepostTrack,
      unsaveTrack,
      unsetArtistPick
    } = props

    const { data: albumInfo } = trpc.tracks.getAlbumBacklink.useQuery(
      { trackId },
      { enabled: !!trackId }
    )
    const isLongFormContent =
      genre === Genre.PODCASTS || genre === Genre.AUDIOBOOKS

    const shareMenuItem = {
      text: messages.share,
      onClick: () => {
        if (trackId) {
          shareTrack(trackId)
          toast(messages.copiedToClipboard)
        }
      }
    }

    const repostMenuItem = {
      text: isReposted ? messages.undoRepost : messages.repost,
      // Set timeout so the menu has time to close before we propagate the change.
      onClick: () =>
        setTimeout(() => {
          isReposted ? undoRepostTrack(trackId) : repostTrack(trackId)
          toast(isReposted ? messages.unreposted : messages.reposted)
        }, 0)
    }

    const favoriteMenuItem = {
      text: isFavorited ? messages.unfavorite : messages.favorite,
      // Set timeout so the menu has time to close before we propagate the change.
      onClick: () =>
        setTimeout(() => {
          isFavorited ? unsaveTrack(trackId) : saveTrack(trackId)
        }, 0)
    }

    const addToPlaylistMenuItem = {
      text: messages.addToPlaylist,
      onClick: () => {
        openAddToCollectionModal(
          'playlist',
          trackId,
          trackTitle,
          isUnlisted ?? false
        )
      }
    }

    const addToAlbumMenuItem = {
      text: messages.addToAlbum,
      onClick: () => {
        openAddToCollectionModal(
          'album',
          trackId,
          trackTitle,
          isUnlisted ?? false
        )
      }
    }

    const trackPageMenuItem = {
      text: isLongFormContent
        ? messages.visitEpisodePage
        : messages.visitTrackPage,
      onClick: () => {
        goToRoute(trackPermalink)
      }
    }

    const markAsUnplayedItem = {
      text: messages.markAsUnplayed,
      onClick: () => {
        dispatch(clearTrackPosition({ userId: currentUserId, trackId }))
        toast(messages.markedAsUnplayed)
      }
    }

    const markAsPlayedItem = {
      text: messages.markAsPlayed,
      onClick: () => {
        dispatch(
          setTrackPosition({
            userId: currentUserId,
            trackId,
            positionInfo: { status: 'COMPLETED', playbackPosition: 0 }
          })
        )
        toast(messages.markedAsPlayed)
      }
    }

    const albumPageMenuItem = {
      text: messages.visitAlbumPage,
      onClick: () =>
        albumInfo &&
        goToRoute(
          albumPage(handle, albumInfo?.playlist_name, albumInfo?.playlist_id)
        )
    }

    const artistPageMenuItem = {
      text: messages.visitArtistPage,
      onClick: () => goToRoute(profilePage(handle))
    }

    const artistPickMenuItem = {
      text: isArtistPick ? messages.unsetArtistPick : messages.setArtistPick,
      onClick: isArtistPick
        ? () => unsetArtistPick()
        : () => setArtistPick(trackId)
    }

    const deleteTrackMenuItem = {
      text: messages.deleteTrack,
      onClick: () => onDeleteTrack(trackId),
      destructive: true
    }

    const editTrackMenuItem = {
      text: messages.editTrack,
      onClick: () => onEditTrack(trackId)
    }

    const embedMenuItem = {
      text: messages.embed,
      onClick: () => openEmbedModal(trackId)
    }

    const menu: { items: PopupMenuItem[] } = { items: [] }

    if (includeShare && !isDeleted) {
      menu.items.push(shareMenuItem)
    }
    if (includeRepost && !isOwner && !isDeleted) {
      menu.items.push(repostMenuItem)
    }
    if (includeFavorite && !isOwner && (!isDeleted || isFavorited)) {
      menu.items.push(favoriteMenuItem)
    }
    if (includeAddToAlbum && !isDeleted && isOwner) {
      menu.items.push(addToAlbumMenuItem)
    }
    if (includeAddToPlaylist && !isDeleted && (!isUnlisted || isOwner)) {
      menu.items.push(addToPlaylistMenuItem)
    }
    if (trackId && trackTitle && !isDeleted) {
      if (includeTrackPage) menu.items.push(trackPageMenuItem)
      if (isLongFormContent) {
        const playbackPosition = trackPlaybackPositions?.[trackId]
        menu.items.push(
          playbackPosition?.status === 'COMPLETED'
            ? markAsUnplayedItem
            : markAsPlayedItem
        )
      }
    }
    if (trackId && isOwner && includeArtistPick && !isDeleted) {
      menu.items.push(artistPickMenuItem)
    }
    if (albumInfo && includeAlbumPage) {
      menu.items.push(albumPageMenuItem)
    }
    if (handle && !isOwnerDeactivated) {
      menu.items.push(artistPageMenuItem)
    }
    if (includeEdit && isOwner && !isDeleted && !ddexApp) {
      menu.items.push(editTrackMenuItem)
    }
    if (extraMenuItems && extraMenuItems.length > 0) {
      menu.items = menu.items.concat(extraMenuItems)
    }
    if (includeEmbed && !isDeleted) {
      menu.items.push(embedMenuItem)
    }
    if (includeDelete && isOwner && !isDeleted && !ddexApp) {
      menu.items.push(deleteTrackMenuItem)
    }

    return menu
  }

  const menu = getMenu()

  return props.children(menu.items)
}

function mapStateToProps(state: AppState) {
  return {
    playlists: getAccountOwnedPlaylists(state),
    currentCollectionId: getCollectionId(state)
  }
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    goToRoute: (route: string) => dispatch(pushRoute(route)),
    addTrackToPlaylist: (trackId: ID, playlistId: ID) =>
      dispatch(addTrackToPlaylist(trackId, playlistId)),
    shareTrack: (trackId: ID) =>
      dispatch(shareTrack(trackId, ShareSource.OVERFLOW)),
    saveTrack: (trackId: ID) =>
      dispatch(saveTrack(trackId, FavoriteSource.OVERFLOW)),
    unsaveTrack: (trackId: ID) =>
      dispatch(unsaveTrack(trackId, FavoriteSource.OVERFLOW)),
    repostTrack: (trackId: ID) =>
      dispatch(repostTrack(trackId, RepostSource.OVERFLOW)),
    undoRepostTrack: (trackId: ID) =>
      dispatch(undoRepostTrack(trackId, RepostSource.OVERFLOW)),
    setArtistPick: (trackId: ID) =>
      dispatch(artistPickModalActions.open({ trackId })),
    unsetArtistPick: () =>
      dispatch(artistPickModalActions.open({ trackId: null })),
    openAddToCollectionModal: (
      collectionType: 'album' | 'playlist',
      trackId: ID,
      title: string,
      isUnlisted: boolean
    ) =>
      dispatch(openAddToCollection(collectionType, trackId, title, isUnlisted)),
    openEmbedModal: (trackId: ID) =>
      dispatch(embedModalActions.open(trackId, PlayableType.TRACK))
  }
}

TrackMenu.defaultProps = {
  includeShare: false,
  includeRepost: false,
  isFavorited: false,
  isReposted: false,
  includeDelete: true,
  includeEdit: true,
  includeEmbed: true,
  includeFavorite: true,
  includeAlbumPage: true,
  includeTrackPage: true,
  includeAddToAlbum: true,
  includeAddToPlaylist: true,
  includeArtistPick: true,
  extraMenuItems: []
}

export default connect(mapStateToProps, mapDispatchToProps)(TrackMenu)
