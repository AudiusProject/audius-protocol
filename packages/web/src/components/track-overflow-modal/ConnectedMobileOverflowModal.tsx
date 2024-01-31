import {
  cacheCollectionsActions,
  cacheCollectionsSelectors,
  cacheTracksSelectors,
  cacheUsersSelectors,
  queueSelectors,
  collectionsSocialActions,
  tracksSocialActions,
  usersSocialActions,
  addToCollectionUIActions,
  deletePlaylistConfirmationModalUIActions,
  mobileOverflowMenuUISelectors,
  shareModalUIActions,
  OverflowSource,
  modalsSelectors,
  modalsActions,
  useEditPlaylistModal,
  Notification
} from '@audius/common/store'

import {
  ShareSource,
  RepostSource,
  FavoriteSource,
  FollowSource,
  ID
} from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import { push as pushRoute } from 'connected-react-router'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import { useFlag } from 'hooks/useRemoteConfig'
import { AppState } from 'store/types'
import {
  collectibleDetailsPage,
  collectionPage,
  profilePage
} from 'utils/route'

import MobileOverflowModal from './components/MobileOverflowModal'

const { makeGetCurrent } = queueSelectors
const { setVisibility } = modalsActions
const { getModalVisibility } = modalsSelectors
const { getMobileOverflowModal } = mobileOverflowMenuUISelectors
const { requestOpen: requestOpenShareModal } = shareModalUIActions
const { requestOpen: openDeletePlaylist } =
  deletePlaylistConfirmationModalUIActions
const { requestOpen: openAddToCollection } = addToCollectionUIActions
const { followUser, unfollowUser } = usersSocialActions
const { repostTrack, saveTrack, undoRepostTrack, unsaveTrack } =
  tracksSocialActions
const {
  repostCollection,
  saveCollection,
  shareCollection,
  undoRepostCollection,
  unsaveCollection
} = collectionsSocialActions
const { getTrack } = cacheTracksSelectors
const { getUser } = cacheUsersSelectors
const { getCollection } = cacheCollectionsSelectors
const { publishPlaylist } = cacheCollectionsActions

type ConnectedMobileOverflowModalProps = {} & ReturnType<
  typeof mapStateToProps
> &
  ReturnType<typeof mapDispatchToProps>

const getCurrent = makeGetCurrent()

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
  collectionPermalink,
  isAlbum,
  shareCollection,
  repostTrack,
  unrepostTrack,
  saveTrack,
  unsaveTrack,
  repostCollection,
  unrepostCollection,
  saveCollection,
  unsaveCollection,
  addToCollection,
  deletePlaylist,
  publishPlaylist,
  visitTrackPage,
  visitArtistPage,
  visitCollectiblePage,
  visitPlaylistPage,
  follow,
  unfollow,
  shareUser
}: ConnectedMobileOverflowModalProps) => {
  const { isEnabled: isEditAlbumsEnabled } = useFlag(FeatureFlags.EDIT_ALBUMS)
  // Create callbacks
  const { onOpen: onOpenEditPlaylist } = useEditPlaylistModal()
  const {
    onRepost,
    onUnrepost,
    onFavorite,
    onUnfavorite,
    onShare,
    onAddToAlbum,
    onAddToPlaylist,
    onEditPlaylist,
    onPublishPlaylist,
    onDeletePlaylist,
    onVisitTrackPage,
    onVisitArtistPage,
    onVisitCollectionPage,
    onVisitCollectiblePage,
    onFollow,
    onUnfollow
  } = ((): {
    onRepost?: () => void
    onUnrepost?: () => void
    onFavorite?: () => void
    onUnfavorite?: () => void
    onShare?: () => void
    onAddToAlbum?: () => void
    onAddToPlaylist?: () => void
    onEditPlaylist?: () => void
    onPublishPlaylist?: () => void
    onDeletePlaylist?: () => void
    onVisitTrackPage?: () => void
    onVisitArtistPage?: () => void
    onVisitCollectiblePage?: () => void
    onVisitCollectionPage?: () => void
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
          onAddToAlbum: () => addToCollection('album', id as ID, title),
          onAddToPlaylist: () => addToCollection('playlist', id as ID, title),
          onVisitCollectiblePage: () => {
            visitCollectiblePage(handle, id as string)
          },
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
            visitPlaylistPage(
              id as ID,
              handle,
              title,
              collectionPermalink || '',
              isAlbum
            ),
          onVisitCollectiblePage: () =>
            visitCollectiblePage(handle, id as string),
          onEditPlaylist:
            !isAlbum || isEditAlbumsEnabled
              ? () => onOpenEditPlaylist({ collectionId: id as ID })
              : () => {},
          onDeletePlaylist: isAlbum ? () => {} : () => deletePlaylist(id as ID),
          onPublishPlaylist: isAlbum
            ? () => {}
            : () => publishPlaylist(id as ID)
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
      onAddToAlbum={onAddToAlbum}
      onAddToPlaylist={onAddToPlaylist}
      onVisitTrackPage={onVisitTrackPage}
      onEditPlaylist={onEditPlaylist}
      onPublishPlaylist={onPublishPlaylist}
      onDeletePlaylist={onDeletePlaylist}
      onVisitArtistPage={onVisitArtistPage}
      onVisitCollectionPage={onVisitCollectionPage}
      onVisitCollectiblePage={onVisitCollectiblePage}
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
  id?: string
  handle?: string
  artistName?: string
  title?: string
  permalink?: string
  isAlbum?: boolean
  notification?: Notification
  ownerId?: ID
  collectionPermalink?: string
} => {
  if (!id) return {}

  switch (source) {
    case OverflowSource.TRACKS: {
      const track = getTrack(state, { id: id as number })
      if (!track) {
        const { collectible, user } = getCurrent(state)
        if (!collectible || !user) return {}

        return {
          id: collectible.id,
          title: collectible.name ?? '',
          ownerId: user.user_id,
          handle: user.handle,
          artistName: user.name,
          permalink: '',
          isAlbum: false
        }
      }

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
        isAlbum: col.is_album,
        collectionPermalink: col.permalink
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
  }
}

const mapStateToProps = (state: AppState) => {
  const modalState = getMobileOverflowModal(state)
  const modalVisibleState = getModalVisibility(state, 'Overflow')
  return {
    ...modalState,
    isOpen: modalVisibleState === true,
    ...getAdditionalInfo({
      state,
      id: modalState.id,
      source: modalState.source
    })
  }
}

const mapDispatchToProps = (dispatch: Dispatch) => {
  return {
    onClose: () =>
      dispatch(setVisibility({ modal: 'Overflow', visible: false })),
    // Tracks
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
    deletePlaylist: (playlistId: ID) =>
      dispatch(openDeletePlaylist({ playlistId })),
    publishPlaylist: (playlistId: ID) => dispatch(publishPlaylist(playlistId)),

    // Users
    follow: (userId: ID) => dispatch(followUser(userId, FollowSource.OVERFLOW)),
    unfollow: (userId: ID) =>
      dispatch(unfollowUser(userId, FollowSource.OVERFLOW)),
    shareUser: (userId: ID) => {
      dispatch(
        requestOpenShareModal({
          type: 'profile',
          profileId: userId,
          source: ShareSource.OVERFLOW
        })
      )
    },
    // Routes
    addToCollection: (
      collectionType: 'album' | 'playlist',
      trackId: ID,
      title: string
    ) => dispatch(openAddToCollection(collectionType, trackId, title)),
    visitTrackPage: (permalink: string) => dispatch(pushRoute(permalink)),
    visitArtistPage: (handle: string) =>
      dispatch(pushRoute(profilePage(handle))),
    visitCollectiblePage: (handle: string, id: string) => {
      dispatch(pushRoute(collectibleDetailsPage(handle, id)))
    },
    visitPlaylistPage: (
      playlistId: ID,
      handle: string,
      playlistTitle: string,
      permalink: string,
      isAlbum: boolean
    ) =>
      dispatch(
        pushRoute(
          collectionPage(handle, playlistTitle, playlistId, permalink, isAlbum)
        )
      )
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ConnectedMobileOverflowModal)
