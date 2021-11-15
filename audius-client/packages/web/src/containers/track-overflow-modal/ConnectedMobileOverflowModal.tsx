import React from 'react'

import { push as pushRoute } from 'connected-react-router'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import {
  FollowSource,
  ShareSource,
  RepostSource,
  FavoriteSource
} from 'common/models/Analytics'
import { ID } from 'common/models/Identifiers'
import { publishPlaylist } from 'common/store/cache/collections/actions'
import { getCollection } from 'common/store/cache/collections/selectors'
import { getTrack } from 'common/store/cache/tracks/selectors'
import { getUser } from 'common/store/cache/users/selectors'
import {
  repostCollection,
  undoRepostCollection,
  saveCollection,
  unsaveCollection,
  shareCollection
} from 'common/store/social/collections/actions'
import {
  repostTrack,
  undoRepostTrack,
  saveTrack,
  unsaveTrack,
  shareTrack
} from 'common/store/social/tracks/actions'
import {
  followUser,
  unfollowUser,
  shareUser
} from 'common/store/social/users/actions'
import { requestOpen as openAddToPlaylist } from 'common/store/ui/add-to-playlist/actions'
import { open as openEditPlaylist } from 'common/store/ui/createPlaylistModal/actions'
import { setOpen as openDeletePlaylist } from 'common/store/ui/delete-playlist-confirmation-modal/actions'
import { close } from 'common/store/ui/mobile-overflow-menu/actions'
import { getMobileOverflowModal } from 'common/store/ui/mobile-overflow-menu/selectors'
import { OverflowSource } from 'common/store/ui/mobile-overflow-menu/types'
import { requestOpen as openTikTokModal } from 'common/store/ui/share-sound-to-tiktok-modal/slice'
import {
  unsubscribeUser,
  hideNotification
} from 'containers/notification/store/actions'
import { getNotificationById } from 'containers/notification/store/selectors'
import {
  Notification,
  NotificationType
} from 'containers/notification/store/types'
import { AppState } from 'store/types'
import { profilePage, playlistPage, albumPage } from 'utils/route'

import MobileOverflowModal from './components/MobileOverflowModal'

type ConnectedMobileOverflowModalProps = {} & ReturnType<
  typeof mapStateToProps
> &
  ReturnType<typeof mapDispatchToProps>

// A connected `MobileOverflowModal`. Builds and injects callbacks for it's contained MobileOverflowModal component.
const ConnectedMobileOverflowModal = ({
  id,
  overflowActions,
  overflowActionCallbacks,
  isOpen,
  onClose,
  source,
  notification,
  ownerId,
  handle,
  artistName,
  title,
  permalink,
  isAlbum,
  shareTrack,
  shareTrackToTikTok,
  shareCollection,
  repostTrack,
  unrepostTrack,
  saveTrack,
  unsaveTrack,
  repostCollection,
  unrepostCollection,
  saveCollection,
  unsaveCollection,
  addToPlaylist,
  editPlaylist,
  deletePlaylist,
  publishPlaylist,
  visitTrackPage,
  visitArtistPage,
  visitPlaylistPage,
  visitAlbumPage,
  unsubscribeUser,
  hideNotification,
  follow,
  unfollow,
  shareUser
}: ConnectedMobileOverflowModalProps) => {
  // Create callbacks
  const {
    onRepost,
    onUnrepost,
    onFavorite,
    onUnfavorite,
    onShare,
    onShareToTikTok,
    onAddToPlaylist,
    onEditPlaylist,
    onPublishPlaylist,
    onDeletePlaylist,
    onVisitTrackPage,
    onVisitArtistPage,
    onVisitCollectionPage,
    onHideNotification,
    onUnsubscribeUser,
    onFollow,
    onUnfollow
  } = ((): {
    onRepost?: () => void
    onUnrepost?: () => void
    onFavorite?: () => void
    onUnfavorite?: () => void
    onShare?: () => void
    onShareToTikTok?: () => void
    onAddToPlaylist?: () => void
    onEditPlaylist?: () => void
    onPublishPlaylist?: () => void
    onDeletePlaylist?: () => void
    onVisitTrackPage?: () => void
    onVisitArtistPage?: () => void
    onVisitCollectionPage?: () => void
    onHideNotification?: () => void
    onUnsubscribeUser?: () => void
    onFollow?: () => void
    onUnfollow?: () => void
  } => {
    switch (source) {
      case OverflowSource.TRACKS: {
        if (!id || !ownerId || !handle || !title || isAlbum === undefined)
          return {}
        return {
          onRepost: () => repostTrack(id as ID),
          onUnrepost: () => unrepostTrack(id as ID),
          onFavorite: () => saveTrack(id as ID),
          onUnfavorite: () => unsaveTrack(id as ID),
          onShare: () => shareTrack(id as ID),
          onShareToTikTok: () => shareTrackToTikTok(id as ID),
          onAddToPlaylist: () => addToPlaylist(id as ID, title),
          onVisitTrackPage: () =>
            permalink === undefined
              ? console.error(`Permalink missing for track ${id}`)
              : visitTrackPage(permalink),
          onVisitArtistPage: () => visitArtistPage(handle),
          onFollow: () => follow(ownerId),
          onUnfollow: () => unfollow(ownerId)
        }
      }
      case OverflowSource.COLLECTIONS: {
        if (!id || !handle || !title || isAlbum === undefined) return {}
        return {
          onRepost: () => repostCollection(id as ID),
          onUnrepost: () => unrepostCollection(id as ID),
          onFavorite: () => saveCollection(id as ID),
          onUnfavorite: () => unsaveCollection(id as ID),
          onShare: () => shareCollection(id as ID),
          onVisitArtistPage: () => visitArtistPage(handle),
          onVisitCollectionPage: () =>
            (isAlbum ? visitAlbumPage : visitPlaylistPage)(
              id as ID,
              handle,
              title
            ),
          onEditPlaylist: isAlbum ? () => {} : () => editPlaylist(id as ID),
          onDeletePlaylist: isAlbum ? () => {} : () => deletePlaylist(id as ID),
          onPublishPlaylist: isAlbum
            ? () => {}
            : () => publishPlaylist(id as ID)
        }
      }
      case OverflowSource.NOTIFICATIONS: {
        if (!id || !notification) return {}
        return {
          onHideNotification: () => hideNotification(id as string),
          ...(notification.type === NotificationType.UserSubscription
            ? {
                onUnsubscribeUser: () => unsubscribeUser(notification.userId)
              }
            : {})
        }
      }

      case OverflowSource.PROFILE: {
        if (!id || !handle || !artistName) return {}
        return {
          onFollow: () => follow(id as ID),
          onUnfollow: () => unfollow(id as ID),
          onShare: () => shareUser(id as ID)
        }
      }
    }
  })()

  return (
    <MobileOverflowModal
      actions={overflowActions}
      callbacks={overflowActionCallbacks}
      isOpen={isOpen}
      onClose={onClose}
      onRepost={onRepost}
      onUnrepost={onUnrepost}
      onFavorite={onFavorite}
      onUnfavorite={onUnfavorite}
      onShare={onShare}
      onShareToTikTok={onShareToTikTok}
      onAddToPlaylist={onAddToPlaylist}
      onVisitTrackPage={onVisitTrackPage}
      onEditPlaylist={onEditPlaylist}
      onPublishPlaylist={onPublishPlaylist}
      onDeletePlaylist={onDeletePlaylist}
      onVisitArtistPage={onVisitArtistPage}
      onVisitCollectionPage={onVisitCollectionPage}
      onHideNotification={onHideNotification}
      onUnsubscribeUser={onUnsubscribeUser}
      onFollow={onFollow}
      onUnfollow={onUnfollow}
    />
  )
}

// Returns { handle, title, isAlbum }, used in mapStateToProps
const getAdditionalInfo = ({
  state,
  id,
  source
}: {
  state: AppState
  id: ID | string | null
  source: OverflowSource
}): {
  handle?: string
  artistName?: string
  title?: string
  permalink?: string
  isAlbum?: boolean
  notification?: Notification
  ownerId?: ID
} => {
  if (!id) return {}

  switch (source) {
    case OverflowSource.TRACKS: {
      const track = getTrack(state, { id: id as number })
      if (!track) return {}
      const user = getUser(state, { id: track.owner_id })
      if (!user) return {}
      return {
        handle: user.handle,
        artistName: user.name,
        title: track.title,
        permalink: track.permalink,
        isAlbum: false,
        ownerId: track.owner_id
      }
    }
    case OverflowSource.COLLECTIONS: {
      const col = getCollection(state, { id: id as number })
      if (!col) return {}
      const user = getUser(state, { id: col.playlist_owner_id })
      if (!user) return {}
      return {
        handle: user.handle,
        artistName: user.name,
        title: col.playlist_name,
        isAlbum: col.is_album
      }
    }
    case OverflowSource.PROFILE: {
      const user = getUser(state, { id: id as number })
      if (!user) return {}
      return {
        handle: user.handle,
        artistName: user.name
      }
    }
    case OverflowSource.NOTIFICATIONS: {
      const notification = getNotificationById(state, id as string)
      return {
        notification
      }
    }
  }
}

const mapStateToProps = (state: AppState) => {
  const modalState = getMobileOverflowModal(state)
  return {
    ...modalState,
    ...getAdditionalInfo({
      state,
      id: modalState.id,
      source: modalState.source
    })
  }
}

const mapDispatchToProps = (dispatch: Dispatch) => {
  return {
    onClose: () => dispatch(close()),
    // Tracks
    shareTrack: (trackId: ID) =>
      dispatch(shareTrack(trackId, ShareSource.OVERFLOW)),
    shareTrackToTikTok: (trackId: ID) =>
      dispatch(openTikTokModal({ id: trackId })),
    repostTrack: (trackId: ID) =>
      dispatch(repostTrack(trackId, RepostSource.OVERFLOW)),
    unrepostTrack: (trackId: ID) =>
      dispatch(undoRepostTrack(trackId, RepostSource.OVERFLOW)),
    saveTrack: (trackId: ID) =>
      dispatch(saveTrack(trackId, FavoriteSource.OVERFLOW)),
    unsaveTrack: (trackId: ID) =>
      dispatch(unsaveTrack(trackId, FavoriteSource.OVERFLOW)),

    // Collections
    shareCollection: (collectionId: ID) =>
      dispatch(shareCollection(collectionId, ShareSource.OVERFLOW)),
    repostCollection: (collectionId: ID, metadata?: any) =>
      dispatch(repostCollection(collectionId, metadata)),
    unrepostCollection: (collectionId: ID, metadata?: any) =>
      dispatch(undoRepostCollection(collectionId, metadata)),
    saveCollection: (collectionId: ID) =>
      dispatch(saveCollection(collectionId, FavoriteSource.OVERFLOW)),
    unsaveCollection: (collectionId: ID) =>
      dispatch(unsaveCollection(collectionId, FavoriteSource.OVERFLOW)),
    editPlaylist: (playlistId: ID) => dispatch(openEditPlaylist(playlistId)),
    deletePlaylist: (playlistId: ID) =>
      dispatch(openDeletePlaylist(playlistId)),
    publishPlaylist: (playlistId: ID) => dispatch(publishPlaylist(playlistId)),

    // Users
    follow: (userId: ID) => dispatch(followUser(userId, FollowSource.OVERFLOW)),
    unfollow: (userId: ID) =>
      dispatch(unfollowUser(userId, FollowSource.OVERFLOW)),
    shareUser: (userId: ID) =>
      dispatch(shareUser(userId, ShareSource.OVERFLOW)),

    // Notification
    unsubscribeUser: (userId: ID) => dispatch(unsubscribeUser(userId)),
    hideNotification: (notificationId: string) =>
      dispatch(hideNotification(notificationId)),

    // Routes
    addToPlaylist: (trackId: ID, title: string) =>
      dispatch(openAddToPlaylist(trackId, title)),
    visitTrackPage: (permalink: string) => dispatch(pushRoute(permalink)),
    visitArtistPage: (handle: string) =>
      dispatch(pushRoute(profilePage(handle))),
    visitPlaylistPage: (
      playlistId: ID,
      handle: string,
      playlistTitle: string
    ) => dispatch(pushRoute(playlistPage(handle, playlistTitle, playlistId))),
    visitAlbumPage: (albumId: ID, handle: string, albumTitle: string) =>
      dispatch(pushRoute(albumPage(handle, albumTitle, albumId)))
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ConnectedMobileOverflowModal)
