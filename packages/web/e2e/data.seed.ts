import { execSync } from 'child_process'

import { test as setup } from './test'
import { existsSync, mkdirSync, readFileSync } from 'fs'
import path from 'path'

const filepath = '../web/e2e/data'
const dataFilesPath = (filename: string) =>
  path.resolve(process.cwd(), filepath, filename)

setup('seed data', async () => {
  if (!existsSync(filepath)) {
    mkdirSync(path.resolve(process.cwd(), filepath))
  }

  const audiusCmd = (cmd: string) => {
    console.log('working directory:', process.cwd())
    const result = execSync(`$HOME/.local/bin/audius-cmd ${cmd}`)
    console.log(result.toString())
  }

  // Create a user
  console.log('Creating user')
  audiusCmd(`create-user --output ${dataFilesPath('user.json')}`)

  // Upload a track
  console.log('Uploading track')
  audiusCmd(`upload-track --output ${dataFilesPath('track.json')}`)
  const track = JSON.parse(readFileSync(dataFilesPath('track.json'), 'utf8'))

  // Create an album
  console.log('Creating album')
  audiusCmd(
    `create-playlist ${track.track_id} -a --output ${dataFilesPath(
      'album.json'
    )}`
  )

  // Create a playlist
  console.log('Creating playlist')
  audiusCmd(
    `create-playlist ${track.track_id} -a --output ${dataFilesPath(
      'playlist.json'
    )}`
  )

  // Upload a remix
  console.log('Uploading remix')
  audiusCmd(
    `upload-track --remix ${track.track_id} --output ${dataFilesPath(
      'remix.json'
    )}`
  )

  // Create another user
  console.log('Creating user2')
  audiusCmd(`create-user --output ${dataFilesPath('user2.json')}`)

  // Upload another track
  console.log('Uploading track2')
  audiusCmd(`upload-track --output ${dataFilesPath('track2.json')}`)
})
