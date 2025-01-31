import { existsSync, mkdirSync } from 'fs'
import { exec as execWithCallback } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { promisify } from 'node:util'

import { test as setup } from './test'

const exec = promisify(execWithCallback)
const dataDir = '../web/e2e/data'
const audiusCmdPath = '$HOME/.local/bin/audius-cmd'
const dataFilePath = (filename: string) => `${dataDir}/${filename}`

setup('seed data', async () => {
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir)
  }

  const audiusCmd = async (cmd: string) => {
    return await exec(`${audiusCmdPath} ${cmd}`)
  }

  // Create a user
  console.info('Creating user...')
  await audiusCmd(`user create -o json > ${dataFilePath('user.json')}`)

  console.info('Getting entropy...')
  await audiusCmd(`entropy > ${dataFilePath('entropy.txt')}`)

  // Upload a track
  console.info('Uploading track...')
  await audiusCmd(`track upload -o json > ${dataFilePath('track.json')}`)
  const trackId = JSON.parse(
    await readFile(dataFilePath('track.json'), 'utf8')
  ).trackId
  await audiusCmd(`track get ${trackId} > ${dataFilePath('track.json')}`)

  await Promise.all([
    (async () => {
      console.info('Creating album...')
      await audiusCmd(
        `album create ${trackId} -o json > ${dataFilePath('album.json')}`
      )
      const albumId = JSON.parse(
        await readFile(dataFilePath('album.json'), 'utf8')
      ).playlistId
      await audiusCmd(`album get ${albumId} > ${dataFilePath('album.json')}`)
    })(),
    (async () => {
      console.info('Creating second album...')
      await audiusCmd(
        `album create ${trackId} -o json > ${dataFilePath('album2.json')}`
      )
      const album2Id = JSON.parse(
        await readFile(dataFilePath('album2.json'), 'utf8')
      ).playlistId
      await audiusCmd(`album get ${album2Id} > ${dataFilePath('album2.json')}`)
    })(),
    (async () => {
      console.info('Creating playlist...')
      await audiusCmd(
        `playlist create ${trackId} -o json > ${dataFilePath('playlist.json')}`
      )
      const playlistId = JSON.parse(
        await readFile(dataFilePath('playlist.json'), 'utf8')
      ).playlistId
      await audiusCmd(
        `playlist get ${playlistId} > ${dataFilePath('playlist.json')}`
      )
    })(),
    (async () => {
      console.info('Creating remix...')
      await audiusCmd(
        `track upload --remix-of '{"tracks":[{"parentTrackId":"${trackId}"}]}' -o json > ${dataFilePath('remix.json')}`
      )
      const remixId = JSON.parse(
        await readFile(dataFilePath('remix.json'), 'utf8')
      ).trackId
      await audiusCmd(`track get ${remixId} > ${dataFilePath('remix.json')}`)
    })()
  ])

  // Create another user
  console.info('Creating user2')
  await audiusCmd(`user create -ai -o json > ${dataFilePath('user2.json')}`)

  // Upload another track
  console.info('Uploading track2')
  await audiusCmd(`track upload -o json > ${dataFilePath('track2.json')}`)
  const track2Id = JSON.parse(
    await readFile(dataFilePath('track2.json'), 'utf8')
  ).trackId
  await audiusCmd(`track get ${track2Id} > ${dataFilePath('track2.json')}`)
})
