import {
  containsTempPlaylist,
  findIndexInPlaylistLibrary,
  findInPlaylistLibrary,
  removeFromPlaylistLibrary,
  removePlaylistLibraryDuplicates,
  reorderPlaylistLibrary
} from './helpers'

describe('findInPlaylistLibrary', () => {
  it('finds an index in the library', () => {
    const library = {
      contents: [
        { type: 'playlist', playlist_id: 1 },
        { type: 'playlist', playlist_id: 2 },
        { type: 'playlist', playlist_id: 3 },
        { type: 'playlist', playlist_id: 4 }
      ]
    }
    const found = findInPlaylistLibrary(library, 2)
    expect(found).toEqual({ type: 'playlist', playlist_id: 2 })
  })

  it('finds an index in the library with folders', () => {
    const library = {
      contents: [
        { type: 'playlist', playlist_id: 1 },
        { type: 'playlist', playlist_id: 2 },
        {
          type: 'folder',
          name: 'favorites',
          contents: [{ type: 'playlist', playlist_id: 3 }]
        },
        { type: 'playlist', playlist_id: 4 }
      ]
    }
    const found = findInPlaylistLibrary(library, 3)
    expect(found).toEqual({ type: 'playlist', playlist_id: 3 })
  })

  it('does not find something not in the library', () => {
    const library = {
      contents: [
        { type: 'playlist', playlist_id: 1 },
        { type: 'playlist', playlist_id: 2 },
        {
          type: 'folder',
          name: 'favorites',
          contents: [{ type: 'playlist', playlist_id: 3 }]
        },
        { type: 'playlist', playlist_id: 4 }
      ]
    }
    const found = findInPlaylistLibrary(library, 10)
    expect(found).toEqual(false)
  })
})

describe('findIndexInPlaylistLibrary', () => {
  it('finds an index in the library', () => {
    const library = {
      contents: [
        { type: 'playlist', playlist_id: 1 },
        { type: 'playlist', playlist_id: 2 },
        { type: 'playlist', playlist_id: 3 },
        { type: 'playlist', playlist_id: 4 }
      ]
    }
    const index = findIndexInPlaylistLibrary(library, 2)
    expect(index).toEqual(1)
  })

  it('does not find something not in the library', () => {
    const library = {
      contents: [
        { type: 'playlist', playlist_id: 1 },
        { type: 'playlist', playlist_id: 2 },
        { type: 'playlist', playlist_id: 3 },
        { type: 'playlist', playlist_id: 4 }
      ]
    }
    const index = findIndexInPlaylistLibrary(library, 10)
    expect(index).toEqual(-1)
  })
})

describe('removeFromPlaylistLibrary', () => {
  it('removes something from the library', () => {
    const library = {
      contents: [
        { type: 'playlist', playlist_id: 1 },
        { type: 'playlist', playlist_id: 2 },
        { type: 'playlist', playlist_id: 3 },
        { type: 'playlist', playlist_id: 4 }
      ]
    }
    const { library: ret, removed } = removeFromPlaylistLibrary(library, 2)
    expect(ret).toEqual({
      contents: [
        { type: 'playlist', playlist_id: 1 },
        { type: 'playlist', playlist_id: 3 },
        { type: 'playlist', playlist_id: 4 }
      ]
    })
    expect(removed).toEqual({ type: 'playlist', playlist_id: 2 })
  })

  it('removes something from the library with folders present', () => {
    const library = {
      contents: [
        { type: 'playlist', playlist_id: 1 },
        { type: 'playlist', playlist_id: 2 },
        {
          type: 'folder',
          name: 'favorites',
          contents: [
            { type: 'playlist', playlist_id: 3 },
            { type: 'playlist', playlist_id: 5 }
          ]
        },
        { type: 'playlist', playlist_id: 4 }
      ]
    }
    const { library: ret, removed } = removeFromPlaylistLibrary(library, 3)
    expect(ret).toEqual({
      contents: [
        { type: 'playlist', playlist_id: 1 },
        { type: 'playlist', playlist_id: 2 },
        {
          type: 'folder',
          name: 'favorites',
          contents: [{ type: 'playlist', playlist_id: 5 }]
        },
        { type: 'playlist', playlist_id: 4 }
      ]
    })
    expect(removed).toEqual({ type: 'playlist', playlist_id: 3 })
  })

  it('does not remove something not in the library', () => {
    const library = {
      contents: [
        { type: 'playlist', playlist_id: 1 },
        { type: 'playlist', playlist_id: 2 },
        {
          type: 'folder',
          name: 'favorites',
          contents: [
            { type: 'playlist', playlist_id: 3 },
            { type: 'playlist', playlist_id: 5 }
          ]
        },
        { type: 'playlist', playlist_id: 4 }
      ]
    }
    const { library: ret, removed } = removeFromPlaylistLibrary(library, 100)
    expect(ret).toEqual({
      contents: [
        { type: 'playlist', playlist_id: 1 },
        { type: 'playlist', playlist_id: 2 },
        {
          type: 'folder',
          name: 'favorites',
          contents: [
            { type: 'playlist', playlist_id: 3 },
            { type: 'playlist', playlist_id: 5 }
          ]
        },
        { type: 'playlist', playlist_id: 4 }
      ]
    })
    expect(removed).toEqual(null)
  })
})

describe('removePlaylistLibraryDuplicates', () => {
  it('can remove single dupes', () => {
    const library = {
      contents: [
        { type: 'playlist', playlist_id: 1 },
        { type: 'playlist', playlist_id: 2 },
        { type: 'playlist', playlist_id: 3 },
        { type: 'playlist', playlist_id: 1 }
      ]
    }
    const ret = removePlaylistLibraryDuplicates(library)
    expect(ret).toEqual({
      contents: [
        { type: 'playlist', playlist_id: 1 },
        { type: 'playlist', playlist_id: 2 },
        { type: 'playlist', playlist_id: 3 }
      ]
    })
  })

  it('does not remove non duplicates', () => {
    const library = {
      contents: [
        { type: 'playlist', playlist_id: 1 },
        { type: 'playlist', playlist_id: 2 },
        { type: 'playlist', playlist_id: 3 },
        { type: 'playlist', playlist_id: 4 },
        { type: 'playlist', playlist_id: 5 },
        { type: 'playlist', playlist_id: 6 }
      ]
    }
    const ret = removePlaylistLibraryDuplicates(library)
    expect(ret).toEqual({
      contents: [
        { type: 'playlist', playlist_id: 1 },
        { type: 'playlist', playlist_id: 2 },
        { type: 'playlist', playlist_id: 3 },
        { type: 'playlist', playlist_id: 4 },
        { type: 'playlist', playlist_id: 5 },
        { type: 'playlist', playlist_id: 6 }
      ]
    })
  })

  it('can remove multiple dupes', () => {
    const library = {
      contents: [
        { type: 'playlist', playlist_id: 1 },
        { type: 'playlist', playlist_id: 2 },
        { type: 'playlist', playlist_id: 3 },
        { type: 'playlist', playlist_id: 1 },
        { type: 'playlist', playlist_id: 2 },
        { type: 'playlist', playlist_id: 3 },
        { type: 'playlist', playlist_id: 3 },
        { type: 'playlist', playlist_id: 3 }
      ]
    }
    const ret = removePlaylistLibraryDuplicates(library)
    expect(ret).toEqual({
      contents: [
        { type: 'playlist', playlist_id: 1 },
        { type: 'playlist', playlist_id: 2 },
        { type: 'playlist', playlist_id: 3 }
      ]
    })
  })

  it('can remove nested dupes', () => {
    const library = {
      contents: [
        { type: 'playlist', playlist_id: 1 },
        { type: 'playlist', playlist_id: 2 },
        { type: 'playlist', playlist_id: 3 },
        {
          type: 'folder',
          name: 'favorites',
          contents: [
            { type: 'playlist', playlist_id: 2 },
            { type: 'playlist', playlist_id: 3 },
            { type: 'playlist', playlist_id: 5 }
          ]
        },
        { type: 'playlist', playlist_id: 3 }
      ]
    }
    const ret = removePlaylistLibraryDuplicates(library)
    expect(ret).toEqual({
      contents: [
        { type: 'playlist', playlist_id: 1 },
        { type: 'playlist', playlist_id: 2 },
        { type: 'playlist', playlist_id: 3 },
        {
          type: 'folder',
          name: 'favorites',
          contents: [{ type: 'playlist', playlist_id: 5 }]
        }
      ]
    })
  })
})

describe('reorderPlaylistLibrary', () => {
  it('can reorder adjacent playlists', () => {
    const library = {
      contents: [
        { type: 'playlist', playlist_id: 1 },
        { type: 'playlist', playlist_id: 2 },
        { type: 'playlist', playlist_id: 3 },
        { type: 'playlist', playlist_id: 4 }
      ]
    }
    const ret = reorderPlaylistLibrary(library, 2, 3)
    expect(ret).toEqual({
      contents: [
        { type: 'playlist', playlist_id: 1 },
        { type: 'playlist', playlist_id: 3 },
        { type: 'playlist', playlist_id: 2 },
        { type: 'playlist', playlist_id: 4 }
      ]
    })
  })

  it('can reorder the start playlist', () => {
    const library = {
      contents: [
        { type: 'playlist', playlist_id: 1 },
        { type: 'playlist', playlist_id: 2 },
        { type: 'playlist', playlist_id: 3 },
        { type: 'playlist', playlist_id: 4 }
      ]
    }
    const ret = reorderPlaylistLibrary(library, 1, 4)
    expect(ret).toEqual({
      contents: [
        { type: 'playlist', playlist_id: 2 },
        { type: 'playlist', playlist_id: 3 },
        { type: 'playlist', playlist_id: 4 },
        { type: 'playlist', playlist_id: 1 }
      ]
    })
  })

  it('can reorder the end playlist', () => {
    const library = {
      contents: [
        { type: 'playlist', playlist_id: 1 },
        { type: 'playlist', playlist_id: 2 },
        { type: 'playlist', playlist_id: 3 },
        { type: 'playlist', playlist_id: 4 }
      ]
    }
    const ret = reorderPlaylistLibrary(library, 4, 1)
    expect(ret).toEqual({
      contents: [
        { type: 'playlist', playlist_id: 1 },
        { type: 'playlist', playlist_id: 4 },
        { type: 'playlist', playlist_id: 2 },
        { type: 'playlist', playlist_id: 3 }
      ]
    })
  })

  it('can reorder a playlist to the beginning', () => {
    const library = {
      contents: [
        { type: 'playlist', playlist_id: 1 },
        { type: 'playlist', playlist_id: 2 },
        { type: 'playlist', playlist_id: 3 },
        { type: 'playlist', playlist_id: 4 }
      ]
    }
    const ret = reorderPlaylistLibrary(library, 3, -1)
    expect(ret).toEqual({
      contents: [
        { type: 'playlist', playlist_id: 3 },
        { type: 'playlist', playlist_id: 1 },
        { type: 'playlist', playlist_id: 2 },
        { type: 'playlist', playlist_id: 4 }
      ]
    })
  })

  it('does not reorder a playlist to a location outside of the library', () => {
    const library = {
      contents: [
        { type: 'playlist', playlist_id: 1 },
        { type: 'playlist', playlist_id: 2 },
        { type: 'playlist', playlist_id: 3 },
        { type: 'playlist', playlist_id: 4 }
      ]
    }
    const ret = reorderPlaylistLibrary(library, 3, 10)
    expect(ret).toEqual({
      contents: [
        { type: 'playlist', playlist_id: 1 },
        { type: 'playlist', playlist_id: 2 },
        { type: 'playlist', playlist_id: 3 },
        { type: 'playlist', playlist_id: 4 }
      ]
    })
  })

  it('inserts a new playlist that was not in the original order', () => {
    const library = {
      contents: [
        { type: 'playlist', playlist_id: 1 },
        { type: 'playlist', playlist_id: 2 },
        { type: 'playlist', playlist_id: 3 },
        { type: 'playlist', playlist_id: 4 }
      ]
    }
    const ret = reorderPlaylistLibrary(library, 5, 2)
    expect(ret).toEqual({
      contents: [
        { type: 'playlist', playlist_id: 1 },
        { type: 'playlist', playlist_id: 2 },
        { type: 'playlist', playlist_id: 5 },
        { type: 'playlist', playlist_id: 3 },
        { type: 'playlist', playlist_id: 4 }
      ]
    })
  })
})

describe('containsTempPlaylist', () => {
  it('finds a temp', () => {
    const library = {
      contents: [
        { type: 'playlist', playlist_id: 1 },
        { type: 'playlist', playlist_id: 2 },
        { type: 'playlist', playlist_id: 3 },
        { type: 'temp_playlist', playlist_id: 'asdf' }
      ]
    }
    const ret = containsTempPlaylist(library)
    expect(ret).toEqual(true)
  })

  it('finds a temp in a folder', () => {
    const library = {
      contents: [
        { type: 'playlist', playlist_id: 1 },
        { type: 'playlist', playlist_id: 2 },
        {
          type: 'folder',
          name: 'favorites',
          contents: [
            { type: 'playlist', playlist_id: 3 },
            { type: 'temp_playlist', playlist_id: 'asdf' }
          ]
        },
        { type: 'playlist', playlist_id: 4 }
      ]
    }
    const ret = containsTempPlaylist(library)
    expect(ret).toEqual(true)
  })

  it('finds no temp', () => {
    const library = {
      contents: [
        { type: 'playlist', playlist_id: 1 },
        { type: 'playlist', playlist_id: 2 },
        { type: 'playlist', playlist_id: 3 }
      ]
    }
    const ret = containsTempPlaylist(library)
    expect(ret).toEqual(false)
  })
})
