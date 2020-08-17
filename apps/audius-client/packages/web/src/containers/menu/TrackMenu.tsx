import React, { ReactNode } from 'react'
import { Dispatch } from 'redux'
import { ID, PlayableType } from 'models/common/Identifiers'
import { connect } from 'react-redux'
import { push as pushRoute } from 'connected-react-router'
import { AppState } from 'store/types'
import { trackPage, profilePage } from 'utils/route'

import {
  createPlaylist,
  addTrackToPlaylist
} from 'store/cache/collections/actions'
import * as editTrackModalActions from 'store/application/ui/editTrackModal/actions'
import * as embedModalActions from 'containers/embed-modal/store/actions'
import {
  saveTrack,
  unsaveTrack,
  repostTrack,
  undoRepostTrack,
  shareTrack
} from 'store/social/tracks/actions'

import { showSetAsArtistPickConfirmation } from 'store/application/ui/setAsArtistPickConfirmation/actions'

import { getAccountOwnedPlaylists } from 'store/account/selectors'
import { newCollectionMetadata } from 'schemas'

import CascadingMenu from 'components/navigation/CascadingMenu'
import { getCollectionId } from 'containers/collection-page/store/selectors'
import {
  FavoriteSource,
  RepostSource,
  ShareSource,
  CreatePlaylistSource
} from 'services/analytics'
import { removeNullable } from 'utils/typeUtils'

const messages = {
  share: 'Share',
  copiedToClipboard: 'Copied To Clipboard!',
  undoRepost: 'Undo Repost',
  repost: 'Repost',
  unreposted: 'Un-Reposted!',
  reposted: 'Reposted!',
  unfavorite: 'Unfavorite',
  favorite: 'Favorite',
  addToPlaylist: 'Add to Playlist',
  addToNewPlaylist: 'Add to New Playlist',
  visitTrackPage: 'Visit Track Page',
  visitArtistPage: 'Visit Artist Page',
  setArtistPick: 'Set as Artist Pick',
  unsetArtistPick: 'Unset as Artist Pick',
  embed: 'Embed'
}

export type OwnProps = {
  children?: ReactNode | JSX.Element
  className?: string
  type: 'track'
  mount: 'page' | 'parent' | 'body'
  handle: string
  trackId: ID
  trackTitle: string
  isOwner: boolean
  includeShare: boolean
  includeRepost: boolean
  includeEdit: boolean
  includeEmbed?: boolean
  isArtistPick: boolean
  isFavorited: boolean
  isReposted: boolean
  isDeleted: boolean
  includeFavorite: boolean
  includeTrackPage: boolean
  includeAddToPlaylist: boolean
  includeArtistPick: boolean
  extraMenuItems?: object[]
}

export type TrackMenuProps = OwnProps &
  ReturnType<typeof mapDispatchToProps> &
  ReturnType<typeof mapStateToProps>

const TrackMenu = (props: TrackMenuProps) => {
  const getMenu = () => {
    const {
      playlists,
      handle,
      trackId,
      trackTitle,
      includeShare,
      includeRepost,
      includeEdit,
      includeEmbed,
      isOwner,
      includeFavorite,
      includeAddToPlaylist,
      includeTrackPage,
      extraMenuItems,
      goToRoute,
      createEmptyPlaylist,
      addTrackToPlaylist,
      isArtistPick,
      isFavorited,
      isReposted,
      isDeleted,
      shareTrack,
      saveTrack,
      unsaveTrack,
      repostTrack,
      undoRepostTrack,
      setArtistPick,
      unsetArtistPick,
      openEditTrackModal,
      openEmbedModal,
      includeArtistPick
    } = props

    const shareMenuItem = {
      text: messages.share,
      onClick: () => {
        if (trackId) {
          shareTrack(trackId)
        }
      },
      showToast: true,
      toastText: messages.copiedToClipboard
    }

    const repostMenuItem = {
      text: isReposted ? messages.undoRepost : messages.repost,
      // Set timeout so the menu has time to close before we propagate the change.
      onClick: () =>
        setTimeout(() => {
          isReposted ? undoRepostTrack(trackId) : repostTrack(trackId)
        }, 0),
      showToast: true,
      toastText: isReposted ? messages.unreposted : messages.reposted
    }

    const favoriteMenuItem = {
      text: isFavorited ? messages.unfavorite : messages.favorite,
      // Set timeout so the menu has time to close before we propagate the change.
      onClick: () =>
        setTimeout(() => {
          isFavorited ? unsaveTrack(trackId) : saveTrack(trackId)
        }, 0)
    }

    const playlistMenuItems = playlists
      .map(playlist => {
        // Don't allow adding to this playlist if already on this playlist's page.
        if (playlist && playlist.id !== props.currentCollectionId) {
          return {
            text: playlist.name,
            onClick: () => addTrackToPlaylist(trackId, playlist.id)
          }
        }
        return null
      })
      .filter(removeNullable)

    const addToPlaylistMenuItem = {
      text: messages.addToPlaylist,
      subItems: [
        {
          text: messages.addToNewPlaylist,
          onClick: () => {
            const tempId = Date.now()
            createEmptyPlaylist(tempId, trackTitle, trackId)
            addTrackToPlaylist(trackId, tempId)
          }
        },
        ...playlistMenuItems
      ]
    }

    const trackPageMenuItem = {
      text: messages.visitTrackPage,
      onClick: () => goToRoute(trackPage(handle, trackTitle, trackId))
    }

    // TODO: Add back go to album when we have better album linking.
    // const albumPageMenuItem = {
    //   text: 'Visit Album Page',
    //   onClick: () => goToRoute(albumPage(handle, albumName, albumId))
    // }

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

    const editTrackMenuItem = {
      text: 'Edit Track',
      onClick: () => openEditTrackModal(trackId)
    }

    const embedMenuItem = {
      text: messages.embed,
      onClick: () => openEmbedModal(trackId)
    }

    const menu: { items: object[] } = { items: [] }

    if (includeShare && !isDeleted) {
      menu.items.push(shareMenuItem)
    }
    if (includeRepost && !isOwner && !isDeleted) {
      menu.items.push(repostMenuItem)
    }
    if (includeFavorite && !isOwner && (!isDeleted || isFavorited)) {
      menu.items.push(favoriteMenuItem)
    }
    if (includeAddToPlaylist && !isDeleted) {
      menu.items.push(addToPlaylistMenuItem)
    }
    if (trackId && trackTitle && includeTrackPage && !isDeleted) {
      menu.items.push(trackPageMenuItem)
    }
    if (trackId && isOwner && includeArtistPick && !isDeleted) {
      menu.items.push(artistPickMenuItem)
    }
    // TODO: Add back go to album when we have better album linking.
    // if (albumId && albumName) {
    //   menu.items.push(albumPageMenuItem)
    // }
    if (handle) {
      menu.items.push(artistPageMenuItem)
    }
    if (includeEdit && isOwner && !isDeleted) {
      menu.items.push(editTrackMenuItem)
    }
    if (extraMenuItems && extraMenuItems.length > 0) {
      menu.items = menu.items.concat(extraMenuItems)
    }
    if (includeEmbed) {
      menu.items.push(embedMenuItem)
    }
    return menu
  }

  const menu = getMenu()

  return (
    <CascadingMenu menu={menu} mount={props.mount} className={props.className}>
      {props.children}
    </CascadingMenu>
  )
}

function mapStateToProps(state: AppState) {
  return {
    playlists: getAccountOwnedPlaylists(state, {}),
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
      dispatch(showSetAsArtistPickConfirmation(trackId)),
    unsetArtistPick: () => dispatch(showSetAsArtistPickConfirmation()),
    createEmptyPlaylist: (tempId: ID, name: string, trackId: ID) =>
      dispatch(
        createPlaylist(
          tempId,
          newCollectionMetadata({ playlist_name: name }),
          CreatePlaylistSource.FROM_TRACK,
          trackId
        )
      ),
    openEditTrackModal: (trackId: ID) =>
      dispatch(editTrackModalActions.open(trackId)),
    openEmbedModal: (trackId: ID) =>
      dispatch(embedModalActions.open(trackId, PlayableType.TRACK))
  }
}

TrackMenu.defaultProps = {
  includeShare: false,
  includeRepost: false,
  isFavorited: false,
  isReposted: false,
  includeEdit: true,
  includeEmbed: true,
  includeFavorite: true,
  includeTrackPage: true,
  includeAddToPlaylist: true,
  includeArtistPick: true,
  extraMenuItems: []
}

export default connect(mapStateToProps, mapDispatchToProps)(TrackMenu)
