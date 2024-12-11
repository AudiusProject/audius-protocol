import { MutableRefObject, useCallback, useMemo } from 'react'

import { CreatePlaylistSource } from '@audius/common/models'
import {
  accountSelectors,
  cacheCollectionsActions,
  playlistLibraryActions,
  playlistLibraryHelpers
} from '@audius/common/store'
import {
  IconFolder,
  IconPlaylists,
  IconSave,
  Pill,
  PopupMenu,
  PopupMenuItem
} from '@audius/harmony'
import { useDispatch } from 'react-redux'

import { useSelector } from 'common/hooks/useSelector'
import { Tooltip } from 'components/tooltip'
import { useRequiresAccountCallback } from 'hooks/useRequiresAccount'

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
  const dispatch = useDispatch()
  const library = useSelector(getPlaylistLibrary)

  const getTooltipPopupContainer = useCallback(
    () => scrollbarRef.current?.parentNode,
    [scrollbarRef]
  )

  const handleSubmitPlaylist = useCallback(() => {
    dispatch(
      createPlaylist(
        { playlist_name: messages.newPlaylistName },
        CreatePlaylistSource.NAV
      )
    )
  }, [dispatch])

  const handleSubmitFolder = useCallback(() => {
    if (!library) return null
    const newLibrary = addFolderToLibrary(
      library,
      constructPlaylistFolder(messages.newFolderName)
    )
    dispatch(updatePlaylistLibrary({ playlistLibrary: newLibrary }))
  }, [dispatch, library])

  // Gate triggering popup behind authentication
  const handleClickPill = useRequiresAccountCallback(
    (triggerPopup: () => void) => {
      triggerPopup()
    },
    []
  )

  const items: PopupMenuItem[] = useMemo(
    () => [
      {
        text: messages.createPlaylist,
        icon: <IconPlaylists />,
        onClick: handleSubmitPlaylist
      },
      {
        text: messages.createFolder,
        icon: <IconFolder />,
        onClick: handleSubmitFolder
      }
    ],
    [handleSubmitPlaylist, handleSubmitFolder]
  )

  return (
    <PopupMenu
      items={items}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      renderTrigger={(anchorRef, onClick, triggerProps) => (
        <Tooltip
          text={messages.newPlaylistOrFolderTooltip}
          getPopupContainer={getTooltipPopupContainer}
        >
          <Pill
            ref={anchorRef}
            iconLeft={IconSave}
            onClick={() => handleClickPill(onClick)}
            css={{ height: 18 }}
            {...triggerProps}
          >
            {messages.new}
          </Pill>
        </Tooltip>
      )}
    />
  )
}
