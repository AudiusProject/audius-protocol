import { execSync } from 'child_process'

import { test as setup } from './test'
import { readFileSync } from 'fs'

setup('seed data', async () => {
  const audiusCmd = (cmd: string) => {
    const result = execSync(`$HOME/.local/bin/audius-cmd ${cmd}`)
    console.log(result.toString())
  }

  // Create a user
  console.log('Creating user')
  audiusCmd('create-user --output ../web/e2e/user.json')

  // Upload a track
  console.log('Uploading track')
  audiusCmd('upload-track --output ../web/e2e/track.json')
  const track = JSON.parse(readFileSync('../web/e2e/track.json', 'utf8'))

  // Create an album
  console.log('Creating album')
  audiusCmd(
    `create-playlist ${track.track_id} -a --output ../web/e2e/album.json`
  )

  // Create a playlist
  console.log('Creating playlist')
  audiusCmd(
    `create-playlist ${track.track_id} -a --output ../web/e2e/playlist.json`
  )

  // Upload a remix
  console.log('Uploading remix')
  audiusCmd(
    `upload-track --remix ${track.track_id} --output ../web/e2e/remix.json`
  )
})
