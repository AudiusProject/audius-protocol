import { readFileSync } from 'fs'
import path from 'path'

const runAgainstLocalStack = process.env.RUN_AGAINST_LOCAL_STACK === 'true'

const dataFilesPath = (filename: string) =>
  path.resolve('../web/e2e/data/', filename)

const getData = (filename: string) =>
  JSON.parse(readFileSync(dataFilesPath(filename), 'utf8'))
const user = () => getData('user.json')
const track = () => getData('track.json')
const remix = () => getData('remix.json')
const album = () => getData('album.json')
const user2 = () => getData('user2.json')
const track2 = () => getData('track2.json')

const sanitizeName = (title: string) => title.replace(/ /g, '-').toLowerCase()

export const getUser = () => {
  if (runAgainstLocalStack) {
    const { name, entropy } = user()

    return {
      name,
      entropy
    }
  }

  return {
    name: 'probertest',
    entropy: 'bdaba824b6e02ab7868c5a2dfdfc7e9f'
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
