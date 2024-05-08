import { execSync } from 'child_process'

import { test as setup } from './test'
import { existsSync, mkdirSync, readFileSync } from 'fs'

const dataDir = '../web/e2e/data'
const dataFilePath = (filename: string) => `${dataDir}/${filename}`

setup('seed data', async () => {
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir)
  }

  const audiusCmd = (cmd: string) => {
    execSync(`$HOME/.local/bin/audius-cmd ${cmd}`)
  }

  // Create a user
  console.log('Creating user')
  audiusCmd(`create-user --output ${dataFilePath('user.json')}`)

  // Upload a track
  console.log('Uploading track')
  audiusCmd(`upload-track --output ${dataFilePath('track.json')}`)
  const track = JSON.parse(readFileSync(dataFilePath('track.json'), 'utf8'))

  // Create an album
  console.log('Creating album')
  audiusCmd(
    `create-playlist ${track.track_id} -a --output ${dataFilePath(
      'album.json'
    )}`
  )

  // Create a playlist
  console.log('Creating playlist')
  audiusCmd(
    `create-playlist ${track.track_id} -a --output ${dataFilePath(
      'playlist.json'
    )}`
  )

  // Upload a remix
  console.log('Uploading remix')
  audiusCmd(
    `upload-track --remix ${track.track_id} --output ${dataFilePath(
      'remix.json'
    )}`
  )

  // Create another user
  console.log('Creating user2')
  audiusCmd(`create-user --output ${dataFilePath('user2.json')}`)

  // Upload another track
  console.log('Uploading track2')
  audiusCmd(`upload-track --output ${dataFilePath('track2.json')}`)
})
