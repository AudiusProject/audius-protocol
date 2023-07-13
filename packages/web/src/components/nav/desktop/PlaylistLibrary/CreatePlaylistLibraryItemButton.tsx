import { MutableRefObject, useCallback, useMemo } from 'react'

import {
  CreatePlaylistSource,
  EditPlaylistValues,
  FeatureFlags,
  Name,
  accountSelectors,
  cacheCollectionsActions,
  createPlaylistModalUIActions,
  createPlaylistModalUISelectors,
  playlistLibraryActions,
  playlistLibraryHelpers
} from '@audius/common'
import {
  PopupMenu,
  IconFolder,
  IconPlaylists,
  PopupMenuItem
} from '@audius/stems'
import { useDispatch } from 'react-redux'

import { useSelector } from 'common/hooks/useSelector'
import { make, useRecord } from 'common/store/analytics/actions'
import CreatePlaylistModal from 'components/create-playlist/CreatePlaylistModal'
import Pill from 'components/pill/Pill'
import { Tooltip } from 'components/tooltip'
import { useAuthenticatedCallback } from 'hooks/useAuthenticatedCallback'
import { useFlag } from 'hooks/useRemoteConfig'

const { getHideFolderTab, getIsOpen } = createPlaylistModalUISelectors
const { createPlaylist } = cacheCollectionsActions
const { addFolderToLibrary, constructPlaylistFolder } = playlistLibraryHelpers
const { update: updatePlaylistLibrary } = playlistLibraryActions
const { getPlaylistLibrary } = accountSelectors

const messages = {
  new: 'New',
  newPlaylistOrFolderTooltip: 'New Playlist or Folder',
  createPlaylist: 'Create Playlist',
  createFolder: 'Create Folder',
  newPlaylistName: 'New Playlist',
  newFolderName: 'New Folder'
}

type Props = {
  scrollbarRef: MutableRefObject<HTMLElement | null>
}

// Allows user to create a playlist or playlist-folder
export const CreatePlaylistLibraryItemButton = (props: Props) => {
  const { scrollbarRef } = props
  const isCreatePlaylistModalOpen = useSelector(getIsOpen)
  const record = useRecord()
  const dispatch = useDispatch()
  const library = useSelector(getPlaylistLibrary)
  const hideFolderTab = useSelector(getHideFolderTab)
  const { isEnabled: isPlaylistUpdatesEnabled } = useFlag(
    FeatureFlags.PLAYLIST_UPDATES_POST_QA
  )

  const getTooltipPopupContainer = useCallback(
    () => scrollbarRef.current?.parentNode,
    [scrollbarRef]
  )

  const handleCreateLegacy = useAuthenticatedCallback(() => {
    dispatch(createPlaylistModalUIActions.open())
    record(
      make(Name.PLAYLIST_OPEN_CREATE, { source: CreatePlaylistSource.NAV })
    )
  }, [dispatch, record])

  const handleClosePlaylistModal = useCallback(() => {
    dispatch(createPlaylistModalUIActions.close())
  }, [dispatch])

  const handleSubmitPlaylist = useCallback(
    (
      metadata: Partial<EditPlaylistValues> = {
        playlist_name: messages.newPlaylistName
      }
    ) => {
      dispatch(createPlaylist(metadata, CreatePlaylistSource.NAV))
      handleClosePlaylistModal()
    },
    [dispatch, handleClosePlaylistModal]
  )

  const handleSubmitFolder = useCallback(
    (folderName = messages.newFolderName) => {
      if (!library) return null
      const newLibrary = addFolderToLibrary(
        library,
        constructPlaylistFolder(folderName)
      )
      dispatch(updatePlaylistLibrary({ playlistLibrary: newLibrary }))
      handleClosePlaylistModal()
    },
    [dispatch, library, handleClosePlaylistModal]
  )

  // Gate triggering popup behind authentication
  const handleClickPill = useAuthenticatedCallback(
    (triggerPopup: () => void) => {
      triggerPopup()
    },
    []
  )

  const legacyPill = (
    <Tooltip
      text={messages.newPlaylistOrFolderTooltip}
      getPopupContainer={getTooltipPopupContainer}
    >
      <Pill text={messages.new} icon='save' onClick={handleCreateLegacy} />
    </Tooltip>
  )

  const items: PopupMenuItem[] = useMemo(
    () => [
      {
        text: messages.createPlaylist,
        icon: <IconPlaylists />,
        onClick: () => handleSubmitPlaylist()
      },
      {
        text: messages.createFolder,
        icon: <IconFolder />,
        onClick: () => handleSubmitFolder()
      }
    ],
    [handleSubmitPlaylist, handleSubmitFolder]
  )

  const pillMenu = (
    <PopupMenu
      items={items}
      renderTrigger={(anchorRef, onClick, triggerProps) => (
        <Tooltip
          text={messages.newPlaylistOrFolderTooltip}
          getPopupContainer={getTooltipPopupContainer}
        >
          <Pill
            // @ts-ignore
            ref={anchorRef}
            text={messages.new}
            icon='save'
            onClick={() => handleClickPill(onClick)}
            {...triggerProps}
          />
        </Tooltip>
      )}
    />
  )

  return (
    <>
      {isPlaylistUpdatesEnabled ? pillMenu : legacyPill}
      <CreatePlaylistModal
        visible={isCreatePlaylistModalOpen}
        onCreatePlaylist={handleSubmitPlaylist}
        onCreateFolder={handleSubmitFolder}
        onCancel={handleClosePlaylistModal}
        hideFolderTab={hideFolderTab}
      />
    </>
  )
}
