import { execSync } from 'child_process'
import { existsSync, mkdirSync, readFileSync } from 'fs'

import { test as setup } from './test'

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
  console.info('Creating user')
  audiusCmd(`user create -o json > ${dataFilePath('user.json')}`)

  console.info('Getting entropy')
  audiusCmd(`entropy > ${dataFilePath('entropy.txt')}`)

  // Upload a track
  console.info('Uploading track')
  audiusCmd(`track upload -o json > ${dataFilePath('track.json')}`)
  const trackId = JSON.parse(
    readFileSync(dataFilePath('track.json'), 'utf8')
  ).trackId
  audiusCmd(`track get ${trackId} > ${dataFilePath('track.json')}`)

  // Create an album
  console.info('Creating album')
  audiusCmd(`album create ${trackId} -o json > ${dataFilePath('album.json')}`)
  const albumId = JSON.parse(
    readFileSync(dataFilePath('album.json'), 'utf8')
  ).playlistId
  audiusCmd(`album get ${albumId} > ${dataFilePath('album.json')}`)

  // Create an album
  console.info('Creating album2')
  audiusCmd(`album create ${trackId} -o json > ${dataFilePath('album2.json')}`)
  const album2Id = JSON.parse(
    readFileSync(dataFilePath('album2.json'), 'utf8')
  ).playlistId
  audiusCmd(`album get ${album2Id} > ${dataFilePath('album2.json')}`)

  // Create a playlist
  console.info('Creating playlist')
  audiusCmd(
    `playlist create ${trackId} -o json > ${dataFilePath('playlist.json')}`
  )
  const playlistId = JSON.parse(
    readFileSync(dataFilePath('playlist.json'), 'utf8')
  ).playlistId
  audiusCmd(`playlist get ${playlistId} > ${dataFilePath('playlist.json')}`)

  // Upload a remix
  console.info('Uploading remix')
  audiusCmd(
    `track upload --remix-of '{"tracks":[{"parentTrackId":"${trackId}"}]}' -o json > ${dataFilePath('remix.json')}`
  )
  const remixId = JSON.parse(
    readFileSync(dataFilePath('remix.json'), 'utf8')
  ).trackId
  audiusCmd(`track get ${remixId} > ${dataFilePath('remix.json')}`)

  // Create another user
  console.info('Creating user2')
  audiusCmd(`user create -ai -o json > ${dataFilePath('user2.json')}`)

  // Upload another track
  console.info('Uploading track2')
  audiusCmd(`track upload -o json > ${dataFilePath('track2.json')}`)
  const track2Id = JSON.parse(
    readFileSync(dataFilePath('track2.json'), 'utf8')
  ).trackId
  audiusCmd(`track get ${track2Id} > ${dataFilePath('track2.json')}`)
})
