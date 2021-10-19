import { ID } from 'common/models/Identifiers'
import {
  PlaylistLibrary,
  PlaylistLibraryFolder,
  PlaylistLibraryIdentifier
} from 'common/models/PlaylistLibrary'
import { SmartCollectionVariant } from 'common/models/SmartCollectionVariant'

/**
 * Finds an item by id in the playlist library
 * @param library
 * @param playlistId
 * @returns the identifier or false
 */
export const findInPlaylistLibrary = (
  library: PlaylistLibrary | PlaylistLibraryFolder,
  playlistId: ID | SmartCollectionVariant
): PlaylistLibraryIdentifier | false => {
  if (!library.contents) return false

  // Simple DFS (this likely is very small, so this is fine)
  for (const item of library.contents) {
    switch (item.type) {
      case 'folder': {
        const contains = findInPlaylistLibrary(item, playlistId)
        if (contains) return contains
        break
      }
      case 'playlist':
      case 'explore_playlist':
      case 'temp_playlist':
        if (item.playlist_id === playlistId) return item
        break
    }
  }
  return false
}

/**
 * Finds the index of a playlist id in the library, returning false if not found
 * @param library
 * @param playlistId
 * @returns {number | false}
 */
export const findIndexInPlaylistLibrary = (
  library: PlaylistLibrary | PlaylistLibraryFolder,
  playlistId: ID | SmartCollectionVariant
): number => {
  if (!library.contents) return -1

  // Simple DFS (this likely is very small, so this is fine)
  for (const [i, item] of library.contents.entries()) {
    switch (item.type) {
      case 'folder': {
        // TODO support folders. Need to devise a better system reorders
        break
      }
      case 'playlist':
      case 'explore_playlist':
      case 'temp_playlist':
        if (item.playlist_id === playlistId) return i
        break
    }
  }
  return -1
}

/**
 * Removes a playlist from the library and returns the removed item as well as the
 * updated library (does not mutate)
 * @param library
 * @param playlistId the id of the playlist to remove
 * @returns { library, removed }
 */
export const removeFromPlaylistLibrary = (
  library: PlaylistLibrary | PlaylistLibraryFolder,
  playlistId: ID | SmartCollectionVariant
): {
  library: PlaylistLibrary | PlaylistLibraryFolder
  removed: PlaylistLibraryIdentifier | null
} => {
  if (!library.contents) return { library, removed: null }

  const newContents: (PlaylistLibraryFolder | PlaylistLibraryIdentifier)[] = []
  let removed: PlaylistLibraryIdentifier | null = null
  for (const item of library.contents) {
    let newItem: PlaylistLibraryFolder | PlaylistLibraryIdentifier | null = item
    switch (item.type) {
      case 'folder': {
        const res = removeFromPlaylistLibrary(item, playlistId)
        removed = res.removed
        newItem = {
          type: item.type,
          name: item.name,
          contents: res.library.contents
        }
        break
      }
      case 'playlist':
      case 'explore_playlist':
      case 'temp_playlist':
        if (item.playlist_id === playlistId) {
          removed = item
          newItem = null
        }
        break
    }
    if (newItem) {
      newContents.push(newItem)
    }
  }
  return {
    library: {
      ...library,
      contents: newContents
    },
    removed
  }
}

/**
 * Removes duplicates in a playlist library
 * @param library
 * @param ids ids to keep track of as we recurse
 */
export const removePlaylistLibraryDuplicates = (
  library: PlaylistLibrary | PlaylistLibraryFolder,
  ids: Set<string> = new Set([])
) => {
  if (!library.contents) return library
  const newContents: (PlaylistLibraryFolder | PlaylistLibraryIdentifier)[] = []

  // Simple DFS (this likely is very small, so this is fine)
  for (const item of library.contents) {
    switch (item.type) {
      case 'folder': {
        const folder = removePlaylistLibraryDuplicates(
          item,
          ids
        ) as PlaylistLibraryFolder
        newContents.push(folder)
        break
      }
      case 'playlist':
      case 'explore_playlist':
      case 'temp_playlist':
        if (ids.has(`${item.playlist_id}`)) {
          break
        }
        ids.add(`${item.playlist_id}`)
        newContents.push(item)
        break
    }
  }
  return {
    ...library,
    contents: newContents
  }
}

/**
 * Reorders a playlist library
 * TODO: Support folder reordering
 * @param library
 * @param draggingId the playlist being reordered
 * @param droppingId the playlist where the dragged one was dropped onto
 */
export const reorderPlaylistLibrary = (
  library: PlaylistLibrary | PlaylistLibraryFolder,
  draggingId: ID | SmartCollectionVariant,
  droppingId: ID | SmartCollectionVariant
) => {
  // Find the dragging id and remove it from the library if present.
  let entry: PlaylistLibraryIdentifier | null
  const { library: newLibrary, removed } = removeFromPlaylistLibrary(
    library,
    draggingId
  )
  entry = removed
  if (!entry) {
    if (typeof draggingId === 'number') {
      entry = {
        type: 'playlist',
        playlist_id: draggingId
      }
    } else if (Object.values(SmartCollectionVariant).includes(draggingId)) {
      entry = {
        type: 'explore_playlist',
        playlist_id: draggingId
      }
    } else {
      // This is a temp ID. We want to reorder it, but pay special attention
      entry = {
        type: 'temp_playlist',
        playlist_id: draggingId
      }
    }
  }

  const newContents = [...newLibrary.contents]

  let index: number
  // We are dropping to the top
  if (droppingId === -1) {
    index = 0
  } else {
    // Find the droppable id and place the draggable id after it
    const found = findIndexInPlaylistLibrary(newLibrary, droppingId)
    if (found === -1) return library
    index = found + 1
  }
  // Doesn't support folder reorder
  newContents.splice(index, 0, entry)
  return {
    ...library,
    contents: newContents
  }
}

/**
 * Determines whether or not a library contains a temp playlist
 * @param library
 * @returns boolean
 */
export const containsTempPlaylist = (
  library: PlaylistLibrary | PlaylistLibraryFolder
): boolean => {
  if (!library.contents) return false

  // Simple DFS (this likely is very small, so this is fine)
  for (const item of library.contents) {
    switch (item.type) {
      case 'folder': {
        const contains = containsTempPlaylist(item)
        if (contains) return contains
        break
      }
      case 'temp_playlist':
        return true
      default:
        break
    }
  }
  return false
}
