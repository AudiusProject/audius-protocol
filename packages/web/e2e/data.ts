import { readFileSync } from 'fs'

const runAgainstLocalStack = process.env.RUN_AGAINST_LOCAL_STACK === 'true'

const user = () => JSON.parse(readFileSync('./e2e/user.json', 'utf8'))
const track = () => JSON.parse(readFileSync('./e2e/track.json', 'utf8'))
const album = () => JSON.parse(readFileSync('./e2e/album.json', 'utf8'))

export const getTrack = () => {
  if (runAgainstLocalStack) {
    const { handle } = user()
    const { title } = track()

    return {
      url: `${handle}/${title.replace(/ /g, '-')}`
    }
  }

  return {
    url: 'sebastian12/bachgavotte-1'
  }
}

export const getAlbum = () => {
  if (runAgainstLocalStack) {
    const { handle } = user()
    const { playlist_name } = album()

    return {
      url: `${handle}/album/${playlist_name.replace(/ /g, '-').toLowerCase()}`,
      name: playlist_name
    }
  }

  return {
    url: 'df/album/probers_album_do_not_delete-512',
    name: 'probers_album_do_not_delete'
  }
}
