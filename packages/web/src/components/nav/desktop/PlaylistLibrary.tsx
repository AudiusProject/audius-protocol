import { useCallback, useContext, useEffect, useMemo } from 'react'

import {
  ID,
  FavoriteSource,
  Name,
  PlaylistLibrary as PlaylistLibraryType,
  PlaylistLibraryFolder,
  SmartCollectionVariant
} from '@audius/common'
import cn from 'classnames'
import { isEmpty } from 'lodash'
import { useDispatch } from 'react-redux'

import { useModalState } from 'common/hooks/useModalState'
import { FeatureFlags } from 'common/services/remote-config'
import {
  getAccountCollectibles,
  getAccountNavigationPlaylists,
  getAccountUser,
  getPlaylistLibrary
} from 'common/store/account/selectors'
import { addTrackToPlaylist } from 'common/store/cache/collections/actions'
import { getPlaylistUpdates } from 'common/store/notifications/selectors'
import {
  addPlaylistToFolder,
  containsTempPlaylist,
  findInPlaylistLibrary,
  getPlaylistsNotInLibrary,
  isInsideFolder,
  reorderPlaylistLibrary
} from 'common/store/playlist-library/helpers'
import { saveSmartCollection } from 'common/store/social/collections/actions'
import Droppable from 'components/dragndrop/Droppable'
import { ToastContext } from 'components/toast/ToastContext'
import { useFlag } from 'hooks/useRemoteConfig'
import {
  AUDIO_NFT_PLAYLIST,
  SMART_COLLECTION_MAP
} from 'pages/smart-collection/smartCollections'
import { make, useRecord } from 'store/analytics/actions'
import { setFolderId as setEditFolderModalFolderId } from 'store/application/ui/editFolderModal/slice'
import { open as openEditPlaylistModal } from 'store/application/ui/editPlaylistModal/slice'
import { getIsDragging } from 'store/dragndrop/selectors'
import { update } from 'store/playlist-library/slice'
import { useSelector } from 'utils/reducer'
import { audioNftPlaylistPage, getPathname, playlistPage } from 'utils/route'

import navColumnStyles from './NavColumn.module.css'
import { PlaylistFolderNavItem } from './PlaylistFolderNavItem'
import styles from './PlaylistLibrary.module.css'
import { PlaylistNavItem, PlaylistNavLink } from './PlaylistNavItem'

type PlaylistLibraryProps = {
  onClickNavLinkWithAccount: () => void
}

type LibraryContentsLevelProps = {
  level?: number
  contents: PlaylistLibraryType['contents']
  renderPlaylist: (playlistId: number, level: number) => void
  renderCollectionPlaylist: (
    playlistId: SmartCollectionVariant,
    level: number
  ) => void
  renderFolder: (folder: PlaylistLibraryFolder, level: number) => void
}

const messages = {
  playlistMovedToFolderToast: (folderName: string) =>
    `This playlist was already in your library. It has now been moved to ${folderName}!`
}

/** Function component for rendering a single level of the playlist library.
 * Playlist library consists of up to two content levels (root + inside a folder) */
const LibraryContentsLevel = ({
  level = 0,
  contents,
  renderPlaylist,
  renderCollectionPlaylist,
  renderFolder
}: LibraryContentsLevelProps) => {
  return (
    <>
      {contents.map((content) => {
        switch (content.type) {
          case 'explore_playlist': {
            return renderCollectionPlaylist(content.playlist_id, level)
          }
          case 'playlist': {
            return renderPlaylist(content.playlist_id, level)
          }
          case 'temp_playlist': {
            return renderPlaylist(parseInt(content.playlist_id), level)
          }
          case 'folder':
            return renderFolder(content, level)
          default:
            return null
        }
      })}
    </>
  )
}

const PlaylistLibrary = ({
  onClickNavLinkWithAccount
}: PlaylistLibraryProps) => {
  const account = useSelector(getAccountUser)
  const playlists = useSelector(getAccountNavigationPlaylists)
  const library = useSelector(getPlaylistLibrary)
  const updates = useSelector(getPlaylistUpdates)
  const updatesSet = new Set(updates)
  const { dragging, kind: draggingKind } = useSelector(getIsDragging)
  const dispatch = useDispatch()
  const { isEnabled: isPlaylistFoldersEnabled } = useFlag(
    FeatureFlags.PLAYLIST_FOLDERS
  )
  const { toast } = useContext(ToastContext)
  const record = useRecord()
  const [, setIsEditFolderModalOpen] = useModalState('EditFolder')

  const accountCollectibles = useSelector(getAccountCollectibles)
  const audioCollectibles = useMemo(
    () =>
      accountCollectibles?.filter((c) =>
        ['mp3', 'wav', 'oga', 'mp4'].some(
          (ext) => c.hasAudio || c.animationUrl?.endsWith(ext)
        )
      ),
    [accountCollectibles]
  )

  // Set audio nft playlist in library if it is not already set
  useEffect(() => {
    if (library) {
      const isAudioNftPlaylistInLibrary = !!findInPlaylistLibrary(
        library,
        SmartCollectionVariant.AUDIO_NFT_PLAYLIST
      )
      if (audioCollectibles.length && !isAudioNftPlaylistInLibrary) {
        dispatch(
          saveSmartCollection(
            AUDIO_NFT_PLAYLIST.playlist_name,
            FavoriteSource.IMPLICIT
          )
        )
      }
    }
  }, [audioCollectibles, library, dispatch])

  const handleClickEditFolder = useCallback(
    (folderId) => {
      dispatch(setEditFolderModalFolderId(folderId))
      setIsEditFolderModalOpen(true)
      record(make(Name.FOLDER_OPEN_EDIT, {}))
    },
    [dispatch, record, setIsEditFolderModalOpen]
  )

  const handleClickEditPlaylist = useCallback(
    (playlistId) => {
      dispatch(openEditPlaylistModal(playlistId))
      record(make(Name.PLAYLIST_OPEN_EDIT_FROM_LIBRARY, {}))
    },
    [dispatch, record]
  )

  const handleDropInFolder = useCallback(
    (
      folder: PlaylistLibraryFolder,
      droppedKind: 'playlist' | 'library-playlist',
      droppedId: ID | string | SmartCollectionVariant
    ) => {
      if (!library) return
      const newLibrary = addPlaylistToFolder(library, droppedId, folder.id)

      // Show a toast if playlist dragged from outside of library was already in the library so it simply got moved to the target folder.
      if (
        droppedKind === 'playlist' &&
        library !== newLibrary &&
        findInPlaylistLibrary(library, droppedId)
      ) {
        toast(messages.playlistMovedToFolderToast(folder.name))
      }
      if (library !== newLibrary) {
        record(make(Name.PLAYLIST_LIBRARY_ADD_PLAYLIST_TO_FOLDER, {}))
        dispatch(update({ playlistLibrary: newLibrary }))
      }
    },
    [dispatch, library, record, toast]
  )

  const onReorder = useCallback(
    (
      draggingId: ID | SmartCollectionVariant | string,
      droppingId: ID | SmartCollectionVariant | string,
      draggingKind: 'library-playlist' | 'playlist' | 'playlist-folder',
      reorderBeforeTarget = false
    ) => {
      if (!library) return
      if (draggingId === droppingId) return
      const libraryBeforeReorder = { ...library }
      const newLibrary = reorderPlaylistLibrary(
        library,
        draggingId,
        droppingId,
        draggingKind,
        reorderBeforeTarget
      )
      dispatch(update({ playlistLibrary: newLibrary }))
      record(
        make(Name.PLAYLIST_LIBRARY_REORDER, {
          containsTemporaryPlaylists: containsTempPlaylist(newLibrary),
          kind: draggingKind
        })
      )
      const isDroppingIntoFolder = isInsideFolder(
        libraryBeforeReorder,
        droppingId
      )
      const isIdInFolderBeforeReorder = isInsideFolder(
        libraryBeforeReorder,
        draggingId
      )
      if (isIdInFolderBeforeReorder && !isDroppingIntoFolder) {
        record(make(Name.PLAYLIST_LIBRARY_MOVE_PLAYLIST_OUT_OF_FOLDER, {}))
      } else if (!isIdInFolderBeforeReorder && isDroppingIntoFolder) {
        record(make(Name.PLAYLIST_LIBRARY_MOVE_PLAYLIST_INTO_FOLDER, {}))
      }
    },
    [dispatch, library, record]
  )

  const renderCollectionPlaylist = (
    playlistId: SmartCollectionVariant,
    level = 0
  ) => {
    const isAudioNftPlaylist =
      playlistId === SmartCollectionVariant.AUDIO_NFT_PLAYLIST
    if (isAudioNftPlaylist && !audioCollectibles.length) return null
    const playlist = SMART_COLLECTION_MAP[playlistId]
    if (!playlist) return null

    const name = playlist.playlist_name
    const url = isAudioNftPlaylist
      ? audioNftPlaylistPage(account?.handle ?? '')
      : playlist.link

    return (
      <PlaylistNavLink
        isInsideFolder={level > 0}
        key={playlist.link}
        playlistId={name as SmartCollectionVariant}
        droppableKey={name as SmartCollectionVariant}
        name={name}
        to={url}
        onReorder={onReorder}
        isActive={() => url === getPathname()}
        activeClassName='active'
        onClick={onClickNavLinkWithAccount}
        className={cn(navColumnStyles.link, {
          [navColumnStyles.disabledLink]:
            !account || (dragging && draggingKind !== 'library-playlist')
        })}>
        {name}
      </PlaylistNavLink>
    )
  }

  const onClickPlaylist = useCallback(
    (playlistId: ID, hasUpdate: boolean) => {
      onClickNavLinkWithAccount()
      record(
        make(Name.PLAYLIST_LIBRARY_CLICKED, {
          playlistId,
          hasUpdate
        })
      )
    },
    [record, onClickNavLinkWithAccount]
  )
  const renderPlaylist = (playlistId: ID, level = 0) => {
    const playlist = playlists[playlistId]
    if (!account || !playlist) return null
    const { id, name } = playlist
    const url = playlistPage(playlist.user.handle, name, id)
    const addTrack = (trackId: ID) => dispatch(addTrackToPlaylist(trackId, id))
    const isOwner = playlist.user.handle === account.handle
    const hasUpdate = updatesSet.has(id)
    return (
      <PlaylistNavItem
        isInsideFolder={level > 0}
        key={id}
        playlist={playlist}
        hasUpdate={hasUpdate}
        url={url}
        addTrack={addTrack}
        isOwner={isOwner}
        onReorder={onReorder}
        dragging={dragging}
        draggingKind={draggingKind}
        onClickPlaylist={onClickPlaylist}
        onClickEdit={
          isOwner && isPlaylistFoldersEnabled
            ? handleClickEditPlaylist
            : undefined
        }
      />
    )
  }

  const renderFolder = (folder: PlaylistLibraryFolder, level = 0) => {
    return (
      <PlaylistFolderNavItem
        key={folder.id}
        folder={folder}
        hasUpdate={folder.contents.some(
          (c) => c.type !== 'folder' && updatesSet.has(Number(c.playlist_id))
        )}
        dragging={dragging}
        draggingKind={draggingKind}
        onClickEdit={handleClickEditFolder}
        onDropBelowFolder={(folderId, draggingKind, draggingId) =>
          onReorder(draggingId, folderId, draggingKind)
        }
        onDropInFolder={handleDropInFolder}>
        {isEmpty(folder.contents) ? null : (
          <div className={styles.folderContentsContainer}>
            {/* This is the droppable area for reordering something in the first slot of the playlist folder. */}
            <Droppable
              className={styles.droppable}
              hoverClassName={styles.droppableHover}
              onDrop={(draggingId, draggingKind) => {
                onReorder(
                  draggingId,
                  folder.contents[0].type === 'folder'
                    ? folder.contents[0].id
                    : folder.contents[0].playlist_id,
                  draggingKind,
                  true
                )
              }}
              acceptedKinds={['playlist-folder', 'library-playlist']}
            />
            <LibraryContentsLevel
              level={level + 1}
              contents={folder.contents}
              renderPlaylist={renderPlaylist}
              renderCollectionPlaylist={renderCollectionPlaylist}
              renderFolder={renderFolder}
            />
          </div>
        )}
      </PlaylistFolderNavItem>
    )
  }

  /** We want to ensure that all playlists attached to the user's account show up in the library UI, even
  /* if the user's library itself does not contain some of the playlists (for example, if a write failed).
  /* This computes those playlists that are attached to the user's account but are not in the user library. */
  const playlistsNotInLibrary = useMemo(() => {
    return getPlaylistsNotInLibrary(library, playlists)
  }, [library, playlists])

  /** Iterate over playlist library and render out available explore/smart
  /* playlists and ordered playlists. Remaining playlists that are unordered
  /* are rendered afterwards by sort order. */
  return (
    <>
      <Droppable
        key={-1}
        className={cn(styles.droppable, styles.top)}
        hoverClassName={styles.droppableHover}
        onDrop={(id: ID | SmartCollectionVariant, kind) =>
          onReorder(id, -1, kind)
        }
        acceptedKinds={['library-playlist', 'playlist-folder']}
      />
      {account && playlists && library ? (
        <LibraryContentsLevel
          contents={library.contents || []}
          renderPlaylist={renderPlaylist}
          renderCollectionPlaylist={renderCollectionPlaylist}
          renderFolder={renderFolder}
        />
      ) : null}
      {Object.values(playlistsNotInLibrary).map((playlist) => {
        return renderPlaylist(playlist.id)
      })}
      {isEmpty(library?.contents) ? (
        <div className={cn(navColumnStyles.link, navColumnStyles.disabled)}>
          Create your first playlist!
        </div>
      ) : null}
    </>
  )
}

export default PlaylistLibrary
