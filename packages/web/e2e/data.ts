import { readFileSync } from 'fs'

const runAgainstLocalStack = process.env.RUN_AGAINST_LOCAL_STACK === 'true'

const user = () => JSON.parse(readFileSync('./e2e/user.json', 'utf8'))
const track = () => JSON.parse(readFileSync('./e2e/track.json', 'utf8'))
const remix = () => JSON.parse(readFileSync('./e2e/remix.json', 'utf8'))
const album = () => JSON.parse(readFileSync('./e2e/album.json', 'utf8'))
const user2 = () => JSON.parse(readFileSync('./e2e/user2.json', 'utf8'))
const track2 = () => JSON.parse(readFileSync('./e2e/track2.json', 'utf8'))

const sanitizeName = (title: string) => title.replace(/ /g, '-').toLowerCase()

export const getUser = () => {
  if (runAgainstLocalStack) {
    const { name } = user()

    return {
      name
    }
  }

  return {
    name: 'probertest'
  }
}

export const getTrack = () => {
  if (runAgainstLocalStack) {
    const { handle } = user()
    const { title } = track()

    return {
      url: `${handle}/${sanitizeName(title)}`,
      name: title
    }
  }

  return {
    url: 'sebastian12/bachgavotte-1',
    name: 'probers_track_do_not_delete'
  }
}

export const getTrack2 = () => {
  if (runAgainstLocalStack) {
    const { handle } = user2()
    const { title } = track2()

    return {
      url: `${handle}/${sanitizeName(title)}`,
      name: title
    }
  }

  return {
    url: 'sebastian12/bachgavotte-1',
    name: 'probers_track_do_not_delete'
  }
}

export const getRemix = () => {
  if (runAgainstLocalStack) {
    const { handle } = user()
    const { title } = remix()

    return {
      url: `${handle}/${sanitizeName(title)}`,
      name: title
    }
  }

  return {
    // TODO: this track has been deleted and should be replaced
    url: 'df/probers_remix_do_not_delete-2859',
    name: 'probers_remix_do_not_delete'
  }
}

export const getRemixes = () => {
  if (runAgainstLocalStack) {
    const { handle } = user()
    const { title } = track()

    return {
      url: `${handle}/${sanitizeName(title)}/remixes`
    }
  }

  return {
    url: 'mb430/traektoria-source-2217/remixes'
  }
}

export const getAlbum = () => {
  if (runAgainstLocalStack) {
    const { handle } = user()
    const { playlist_name } = album()

    return {
      url: `${handle}/album/${sanitizeName(playlist_name)}`,
      name: playlist_name
    }
  }

  return {
    url: 'df/album/probers_album_do_not_delete-512',
    name: 'probers_album_do_not_delete'
  }
}

export const getPlaylist = () => {
  if (runAgainstLocalStack) {
    const { handle } = user()
    const { playlist_name } = album()

    return {
      url: `${handle}/album/${sanitizeName(playlist_name)}`,
      name: playlist_name
    }
  }

  return {
    url: 'df/playlist/probers_playlist_do_not_delete-511',
    name: 'PROBERS_PLAYLIST_DO_NOT_DELETE'
  }
}

export const getAiAttributionUser = () => {
  if (runAgainstLocalStack) {
    const { handle, name } = user2()

    return {
      handle,
      name
    }
  }

  return {
    name: 'probers ai DO NOT DELETE'
  }
}
