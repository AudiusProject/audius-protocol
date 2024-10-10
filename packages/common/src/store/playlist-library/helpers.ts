import { AccountCollection } from '~/models/Collection'
import { Nullable } from '~/utils/typeUtils'
import { uuid } from '~/utils/uid'

import { ID } from '../../models/Identifiers'
import {
  PlaylistLibrary,
  PlaylistLibraryIdentifier,
  PlaylistLibraryFolder,
  PlaylistLibraryID
} from '../../models/PlaylistLibrary'
import { SmartCollectionVariant } from '../../models/SmartCollectionVariant'

/**
 * Finds a playlist by id in the playlist library
 * @param library
 * @param playlistId
 * @returns the identifier or false
 */
export const findInPlaylistLibrary = (
  library: Nullable<PlaylistLibrary | PlaylistLibraryFolder>,
  playlistId: ID | SmartCollectionVariant | string
): PlaylistLibraryIdentifier | false => {
  if (!library || !library.contents) return false

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
        if (item.playlist_id === playlistId) return item
        break
    }
  }
  return false
}

/**
 * Finds the index of a playlist or folder id in the library, returning -1 if not found
 * If the target item is nested in a folder, this returns a tuple where the first value is the
 * index of the folder and the second value is the index of the item within that folder's contents.
 * @param library
 * @param entityId
 * @returns {number | number[] | false}
 */
export const findIndexInPlaylistLibrary = (
  library: PlaylistLibrary | PlaylistLibraryFolder,
  entityId: ID | SmartCollectionVariant | string
): number | number[] | -1 => {
  if (!library.contents) return -1

  // Simple DFS (this likely is very small, so this is fine)
  for (const [i, item] of library.contents.entries()) {
    switch (item.type) {
      case 'folder': {
        if (item.id === entityId) return i
        const indexInFolder = findIndexInPlaylistLibrary(item, entityId)
        if (indexInFolder !== -1) {
          return [i].concat(indexInFolder)
        }
        break
      }
      case 'playlist':
      case 'explore_playlist':
        if (item.playlist_id === entityId) return i
        break
    }
  }
  return -1
}

/**
 * Removes a playlist or folder from the library and returns the removed item as well as the
 * updated library (does not mutate)
 * @param library
 * @param entityId the id of the playlist or folder to remove
 * @returns { library, removed }
 */
export const removeFromPlaylistLibrary = (
  library: PlaylistLibrary | PlaylistLibraryFolder,
  entityId: ID | SmartCollectionVariant | string
): {
  library: PlaylistLibrary | PlaylistLibraryFolder
  removed: PlaylistLibraryIdentifier | PlaylistLibraryFolder | null
} => {
  if (!library.contents) return { library, removed: null }

  const newContents: (PlaylistLibraryFolder | PlaylistLibraryIdentifier)[] = []
  let removed: PlaylistLibraryIdentifier | PlaylistLibraryFolder | null = null
  for (const item of library.contents) {
    let newItem: PlaylistLibraryFolder | PlaylistLibraryIdentifier | null = item
    switch (item.type) {
      case 'folder': {
        if (item.id === entityId) {
          removed = item
          newItem = null
        } else {
          const res = removeFromPlaylistLibrary(item, entityId)
          if (res.removed) {
            removed = res.removed
          }
          newItem = {
            id: item.id,
            type: item.type,
            name: item.name,
            contents: res.library.contents
          }
        }
        break
      }
      case 'playlist':
      case 'explore_playlist':
        if (item.playlist_id === entityId) {
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
    contents
  }
}

const playlistIdToPlaylistLibraryIdentifier = (
  playlistId: ID | SmartCollectionVariant | string
): Nullable<PlaylistLibraryIdentifier> => {
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
  }
  return null
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
  let folderIndex = library.contents.findIndex((item) => {
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

  if (removed?.type === 'folder') {
    // Shouldn't hit this but this enforces the right type for `removed`
    return library
  }
  entry = removed as PlaylistLibraryIdentifier

  if (!entry) {
    entry = playlistIdToPlaylistLibraryIdentifier(playlistId)
  } else {
    // If playlist was removed the folder index might be different now.
    folderIndex = newLibrary.contents.findIndex((item) => {
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
  const folderIndex = library.contents.findIndex((item) => {
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
 * Any playlists in the deleted
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
  const folder = library.contents.find((item) => {
    return item.type === 'folder' && item.id === folderId
    // Need to cast here because TS doesn't know that the result has to be a folder or undefined due to `item.type === 'folder'`
  }) as PlaylistLibraryFolder | undefined
  if (!folder) return library
  const folderIndex = library.contents.findIndex((item) => {
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
    contents: [folder, ...(library?.contents || [])]
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
 * Note that this helper assumes that folders cannot be inside folders.
 * If we ever support nesting folders, this must be updated.
 * @param library
 * @param draggingId the playlist being reordered
 * @param droppingId the playlist where the dragged one was dropped onto
 */
export const reorderPlaylistLibrary = (
  library: PlaylistLibrary | PlaylistLibraryFolder,
  draggingId: PlaylistLibraryID,
  droppingId: PlaylistLibraryID,
  draggingKind = 'library-playlist',
  reorderBeforeTarget = false
) => {
  // Find the dragging id and remove it from the library if present.
  let entry: PlaylistLibraryIdentifier | PlaylistLibraryFolder | null
  const { library: newLibrary, removed } = removeFromPlaylistLibrary(
    library,
    draggingId
  )
  entry = removed
  if (!entry) {
    if (draggingKind === 'playlist-folder') {
      // Soft fail if the thing being dragged is a folder and it doesn't exist in the library yet. This shouldn't be possible.
      return library
    } else {
      entry = playlistIdToPlaylistLibraryIdentifier(draggingId)
    }
  }

  const newContents = [...newLibrary.contents]

  if (!entry) return { ...library, contents: newContents }

  let index: number | number[]
  // We are dropping to the top
  if (droppingId === -1) {
    index = 0
  } else {
    // Find the droppable id and place the draggable id after it
    const found = findIndexInPlaylistLibrary(newLibrary, droppingId)
    if (found === -1) return library
    const indexShift = reorderBeforeTarget ? 0 : 1
    if (Array.isArray(found)) {
      index = [found[0], found[1] + indexShift]
    } else {
      index = found + indexShift
    }
  }
  if (Array.isArray(index)) {
    // The lines below assumes that folders cannot be nested inside folders; that is, that the
    // dropId will only ever be up to one level deep.
    // This must be updated if we ever allow nested folders.
    const folderIndex = index[0]
    const dropIndex = index[1]
    const folder = newContents[folderIndex] as PlaylistLibraryFolder
    const updatedFolderContents = [...folder.contents]
    updatedFolderContents.splice(dropIndex, 0, entry)
    const updatedFolder = { ...folder, contents: updatedFolderContents }
    newContents.splice(folderIndex, 1, updatedFolder)
  } else {
    newContents.splice(index, 0, entry)
  }
  return {
    ...library,
    contents: newContents
  }
}

/**
 * Determines whether or not a playlist or folder is inside a folder
 * @param library
 * @param id (playlist or folder id)
 * @returns boolean
 */
export const isInsideFolder = (
  library: PlaylistLibrary | PlaylistLibraryFolder,
  id: ID | string | SmartCollectionVariant
): boolean => {
  return Array.isArray(findIndexInPlaylistLibrary(library, id))
}

/* Returns playlists in `playlists` that are not in the given playlist library `library`. */
export const getPlaylistsNotInLibrary = (
  library: PlaylistLibrary | null,
  playlists: {
    [id: number]: AccountCollection
  }
) => {
  const result = { ...playlists }
  const helpComputePlaylistsNotInLibrary = (
    libraryContentsLevel: PlaylistLibrary['contents']
  ) => {
    libraryContentsLevel.forEach((content) => {
      if (content.type === 'playlist') {
        const playlist = playlists[Number(content.playlist_id)]
        if (playlist) {
          delete result[Number(content.playlist_id)]
        }
      } else if (content.type === 'folder') {
        helpComputePlaylistsNotInLibrary(content.contents)
      }
    })
  }
  if (library && playlists) {
    helpComputePlaylistsNotInLibrary(library.contents)
  }
  return result
}
