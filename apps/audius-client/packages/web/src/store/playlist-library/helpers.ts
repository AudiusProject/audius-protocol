import isEmpty from 'lodash/isEmpty'

import { ID } from 'common/models/Identifiers'
import {
  PlaylistLibrary,
  PlaylistLibraryFolder,
  PlaylistLibraryIdentifier
} from 'common/models/PlaylistLibrary'
import { SmartCollectionVariant } from 'common/models/SmartCollectionVariant'
import { uuid } from 'common/utils/uid'

/**
 * Finds an item by id in the playlist library
 * @param library
 * @param playlistId
 * @returns the identifier or false
 */
export const findInPlaylistLibrary = (
  library: PlaylistLibrary | PlaylistLibraryFolder,
  playlistId: ID | SmartCollectionVariant | string
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
  playlistId: ID | SmartCollectionVariant | string
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
  playlistId: ID | SmartCollectionVariant | string
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
        if (res.removed) {
          removed = res.removed
        }
        newItem = {
          id: item.id,
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

export const constructPlaylistFolder = (
  name: string,
  contents: (PlaylistLibraryFolder | PlaylistLibraryIdentifier)[] = []
): PlaylistLibraryFolder => {
  return {
    id: uuid(),
    type: 'folder',
    name,
    contents: contents
  }
}

const playlistIdToPlaylistLibraryIdentifier = (
  playlistId: ID | SmartCollectionVariant | string
): PlaylistLibraryIdentifier => {
  if (typeof playlistId === 'number') {
    return {
      type: 'playlist',
      playlist_id: playlistId
    }
  } else if (
    (Object.values(SmartCollectionVariant) as string[]).includes(playlistId)
  ) {
    return {
      type: 'explore_playlist',
      playlist_id: playlistId as SmartCollectionVariant
    }
  } else {
    // This is a temp ID which requires special attention
    return {
      type: 'temp_playlist',
      playlist_id: playlistId
    }
  }
}

/**
 * Adds playlist with given id to folder with given id and returns the resulting updated library.
 * If the playlist is already in the library but not in the folder, it removes the playlist from its current position and into the folder.
 * This is a no op if the folder is not in the library or the playlist is already in the target folder. In these cases, the original library is returned.
 * @param library
 * @param playlistId
 * @param folderId
 * @returns the updated playlist library
 */
export const addPlaylistToFolder = (
  library: PlaylistLibrary,
  playlistId: ID | SmartCollectionVariant | string,
  folderId: string
): PlaylistLibrary => {
  if (!library.contents) return library
  let folderIndex = library.contents.findIndex(item => {
    return item.type === 'folder' && item.id === folderId
  })
  if (folderIndex < 0) return library
  const folder = library.contents[folderIndex] as PlaylistLibraryFolder
  // If the playlist is in the right folder already, return the original library.
  if (findInPlaylistLibrary(folder, playlistId) !== false) {
    return library
  }

  // Remove the playlist from the library if it's already there but not in the given folder
  let entry: PlaylistLibraryIdentifier | null
  const { library: newLibrary, removed } = removeFromPlaylistLibrary(
    library,
    playlistId
  )

  entry = removed

  if (!entry) {
    entry = playlistIdToPlaylistLibraryIdentifier(playlistId)
  } else {
    // If playlist was removed the folder index might be different now.
    folderIndex = newLibrary.contents.findIndex(item => {
      return item.type === 'folder' && item.id === folderId
    })
  }
  const updatedFolder = reorderPlaylistLibrary(
    folder,
    playlistId,
    -1
  ) as PlaylistLibraryFolder
  const newContents = [...newLibrary.contents]

  newContents.splice(folderIndex, 1, updatedFolder)

  return {
    ...newLibrary,
    contents: newContents
  }
}

/**
 * Changes name of folder with given id to the given new name and returns the resulting
 * updated library. Does not mutate the given library object.
 * Note that this assumes that folders cannot be nested within one another.
 * If we enable nesting folders in the future, this function must be updated.
 * @param library
 * @param folderId
 * @param newName
 * @returns the updated playlist library
 */
export const renamePlaylistFolderInLibrary = (
  library: PlaylistLibrary,
  folderId: string,
  newName: string
): PlaylistLibrary => {
  if (!library.contents) return library
  const folderIndex = library.contents.findIndex(item => {
    return item.type === 'folder' && item.id === folderId
  })
  if (folderIndex < 0) return library
  const folder = library.contents[folderIndex]
  const updatedFolder = { ...folder, name: newName }
  const newContents = [...library.contents]
  newContents.splice(folderIndex, 1, updatedFolder)
  return {
    ...library,
    contents: newContents
  }
}

/**
 * Removes folder with given id from the library.
 * Any playlists or temporary playlists in the deleted
 * folder are moved out of the folder.
 * Note that this assumes that folders cannot be nested within one another.
 * If we enable nesting folders in the future, this function must be updated.
 * @param library
 * @param folderId
 * @returns the updated playlist library
 */
export const removePlaylistFolderInLibrary = (
  library: PlaylistLibrary,
  folderId: string
): PlaylistLibrary => {
  if (!library.contents) return library
  const folder = library.contents.find(item => {
    return item.type === 'folder' && item.id === folderId
    // Need to cast here because TS doesn't know that the result has to be a folder or undefined due to `item.type === 'folder'`
  }) as PlaylistLibraryFolder | undefined
  if (!folder) return library
  const folderIndex = library.contents.findIndex(item => {
    return item.type === 'folder' && item.id === folderId
  })
  const newContents = [...library.contents]
  // Move contents of folder out
  const removedFolderContents = folder.contents
  newContents.splice(folderIndex, 1, ...removedFolderContents)
  return {
    ...library,
    contents: newContents
  }
}

/**
 * Adds new folder to a playlist library and returns the result.
 * Does not mutate.
 * @param library
 * @param folder
 */
export const addFolderToLibrary = (
  library: PlaylistLibrary | null,
  folder: PlaylistLibraryFolder
): PlaylistLibrary => {
  return {
    ...(library || {}),
    contents: [...(library?.contents || []), folder]
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
        // If we've seen this folder already, don't include it in our final result.
        if (ids.has(item.id)) {
          break
        }
        ids.add(item.id)
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
        // If we've seen this playlist already, don't include it in our final result.
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
  draggingId: ID | SmartCollectionVariant | string,
  droppingId: ID | SmartCollectionVariant | string
) => {
  // Find the dragging id and remove it from the library if present.
  let entry: PlaylistLibraryIdentifier | null
  const { library: newLibrary, removed } = removeFromPlaylistLibrary(
    library,
    draggingId
  )
  entry = removed
  if (!entry) {
    entry = playlistIdToPlaylistLibraryIdentifier(draggingId)
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

/**
 * Takes a library and returns a list of all temporary playlists from that library
 * @param library
 * @returns PlaylistLibraryIdentifier[]
 */
export const extractTempPlaylistsFromLibrary = (
  library: PlaylistLibrary | PlaylistLibraryFolder
): PlaylistLibraryIdentifier[] => {
  if (isEmpty(library.contents)) return []
  return library.contents.reduce((prevResult, nextContent) => {
    if (nextContent.type === 'folder') {
      return prevResult.concat(extractTempPlaylistsFromLibrary(nextContent))
    } else if (nextContent.type === 'temp_playlist') {
      return prevResult.concat(nextContent)
    } else {
      return prevResult
    }
  }, [] as PlaylistLibraryIdentifier[])
}

/**
 * Takes a library and mapping of temporary playlist ids to their resolved
 * playlist identifiers, then returns the library (does not mutate original)
 * with temporary playlists replaced by their resolved playlist identifiers.
 * @param library
 * @param tempPlaylistIdToResolvedPlaylist object that maps temporary playlist ids to their resolved playlist identifiers
 * @returns PlaylistLibrary | PlaylistLibraryFolder
 */
export const replaceTempWithResolvedPlaylists = <
  T extends PlaylistLibrary | PlaylistLibraryFolder
>(
  library: T,
  tempPlaylistIdToResolvedPlaylist: Record<string, PlaylistLibraryIdentifier>
): T => {
  if (isEmpty(library.contents)) return library
  const newContents = library.contents.map(c => {
    if (c.type === 'folder') {
      return replaceTempWithResolvedPlaylists(
        c,
        tempPlaylistIdToResolvedPlaylist
      )
    } else if (c.type === 'temp_playlist') {
      return tempPlaylistIdToResolvedPlaylist[c.playlist_id] ?? c
    } else {
      return c
    }
  })
  return { ...library, contents: newContents }
}
