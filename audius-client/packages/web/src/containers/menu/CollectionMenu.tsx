import React from 'react'
import { connect } from 'react-redux'
import { push as pushRoute } from 'connected-react-router'
import { Dispatch } from 'redux'
import { albumPage, playlistPage, profilePage } from 'utils/route'

import * as socialActions from 'store/social/collections/actions'
import * as embedModalActions from 'containers/embed-modal/store/actions'
import { open as openEditCollectionModal } from 'store/application/ui/editPlaylistModal/slice'

import CascadingMenu from 'components/navigation/CascadingMenu'
import { ShareSource, FavoriteSource, RepostSource } from 'services/analytics'
import { PlayableType, ID } from 'models/common/Identifiers'
import { AppState } from 'store/types'
import { getUser } from 'store/cache/users/selectors'

type PlaylistId = number
export type OwnProps = {
  mount: string
  children?: JSX.Element
  className?: string
  type: 'album' | 'playlist'
  handle: string
  playlistName: string
  isOwner: boolean
  isArtist: boolean
  isPublic: boolean
  playlistId: PlaylistId
  includeEdit?: boolean
  includeShare: boolean
  includeRepost: boolean
  includeFavorite: boolean
  includeEmbed: boolean
  includeVisitPage: boolean
  isFavorited: boolean
  isReposted: boolean
  extraMenuItems: object[]
  onShare?: () => void
  onRepost?: () => void
  onClose?: () => void
}

export type CollectionMenuProps = OwnProps &
  ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>

const messages = {
  embed: 'Embed'
}

const CollectionMenu: React.FC<CollectionMenuProps> = props => {
  const getMenu = () => {
    const {
      type,
      handle,
      playlistName,
      playlistId,
      isOwner,
      isFavorited,
      isReposted,
      includeEdit,
      includeShare,
      includeRepost,
      includeFavorite,
      includeEmbed,
      includeVisitPage,
      isPublic,
      isArtist,
      onShare,
      goToRoute,
      openEmbedModal,
      editCollection,
      shareCollection,
      saveCollection,
      unsaveCollection,
      repostCollection,
      undoRepostCollection,
      onRepost,
      extraMenuItems
    } = props

    const routePage = type === 'album' ? albumPage : playlistPage
    const shareMenuItem = {
      text: 'Share',
      onClick: () => {
        shareCollection(playlistId)
        if (onShare) onShare()
      }
    }

    const typeName = type === 'album' ? 'Album' : 'Playlist'
    const favoriteMenuItem = {
      text: isFavorited ? `Unfavorite ${typeName}` : `Favorite ${typeName}`,
      onClick: () =>
        isFavorited ? unsaveCollection(playlistId) : saveCollection(playlistId)
    }

    const repostMenuItem = {
      text: isReposted ? 'Undo Repost' : 'Repost',
      onClick: () => {
        if (isReposted) {
          undoRepostCollection(playlistId)
        } else {
          repostCollection(playlistId)
          if (onRepost) onRepost()
        }
      }
    }

    const artistPageMenuItem = {
      text: `Visit ${isArtist ? 'Artist' : 'User'} Page`,
      onClick: () => goToRoute(profilePage(handle))
    }

    const playlistPageMenuItem = {
      text: `Visit ${typeName} Page`,
      onClick: () => goToRoute(routePage(handle, playlistName, playlistId))
    }

    const editCollectionMenuItem = {
      text: `Edit ${typeName}`,
      onClick: () => editCollection(playlistId)
    }

    const embedMenuItem = {
      text: messages.embed,
      onClick: () =>
        openEmbedModal(
          playlistId,
          type === 'album' ? PlayableType.ALBUM : PlayableType.PLAYLIST
        )
    }

    const menu: { items: object[] } = { items: [] }

    if (menu) {
      if (includeShare) menu.items.push(shareMenuItem)
    }
    if (!isOwner) {
      if (includeRepost) menu.items.push(repostMenuItem)
      if (includeFavorite) menu.items.push(favoriteMenuItem)
    }
    menu.items.push(artistPageMenuItem)
    if (includeVisitPage) {
      menu.items.push(playlistPageMenuItem)
    }
    if (extraMenuItems.length > 0) {
      menu.items = menu.items.concat(extraMenuItems)
    }
    if (includeEmbed && isPublic) {
      menu.items.push(embedMenuItem)
    }
    if (includeEdit && isOwner) {
      menu.items.push(editCollectionMenuItem)
    }

    return menu
  }

  const collectionMenu = getMenu()

  return (
    <CascadingMenu
      menu={collectionMenu}
      mount={props.mount}
      onClose={props.onClose}
      className={props.className}
    >
      {props.children}
    </CascadingMenu>
  )
}

function mapStateToProps(state: AppState, props: OwnProps) {
  const user = getUser(state, {
    handle: props.handle ? props.handle.toLowerCase() : null
  })
  return {
    isArtist: user ? user.is_creator : false
  }
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    goToRoute: (route: string) => dispatch(pushRoute(route)),
    shareCollection: (playlistId: PlaylistId) =>
      dispatch(socialActions.shareCollection(playlistId, ShareSource.OVERFLOW)),
    editCollection: (playlistId: ID) =>
      dispatch(openEditCollectionModal(playlistId)),
    saveCollection: (playlistId: PlaylistId) =>
      dispatch(
        socialActions.saveCollection(playlistId, FavoriteSource.OVERFLOW)
      ),
    unsaveCollection: (playlistId: PlaylistId) =>
      dispatch(
        socialActions.unsaveCollection(playlistId, FavoriteSource.OVERFLOW)
      ),
    repostCollection: (playlistId: PlaylistId) =>
      dispatch(
        socialActions.repostCollection(playlistId, RepostSource.OVERFLOW)
      ),
    undoRepostCollection: (playlistId: PlaylistId) =>
      dispatch(
        socialActions.undoRepostCollection(playlistId, RepostSource.OVERFLOW)
      ),
    openEmbedModal: (playlistId: ID, kind: PlayableType) =>
      dispatch(embedModalActions.open(playlistId, kind))
  }
}

CollectionMenu.defaultProps = {
  handle: '',
  mount: 'page',
  isFavorited: false,
  isReposted: false,
  includeFavorite: true,
  isArtist: false,
  includeVisitPage: true,
  includeEmbed: true,
  extraMenuItems: []
}

export default connect(mapStateToProps, mapDispatchToProps)(CollectionMenu)
