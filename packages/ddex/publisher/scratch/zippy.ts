import 'dotenv/config'

import decompress from 'decompress'
import { mkdtemp, readFile, readdir, rm, rmdir, unlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, join, resolve } from 'node:path'
import * as cheerio from 'cheerio'
import { createSdkService } from '../src/services/sdkService'
import { UploadTrackRequest, Genre } from '@audius/sdk'

type CH = cheerio.Cheerio<cheerio.Element>

type DDEXRelease = {
  ref: string
  isrc?: string
  title: string
  subTitle?: string
  artists: string[]
  genre: string
  subGenre: string
  releaseDate?: string
  releaseType: string

  isMainRelease: boolean
  audiusGenre?: Genre

  soundRecordings: DDEXSoundRecording[]
  images: DDEXImage[]
}

type DDEXSoundRecording = {
  ref: string
  isrc?: string
  filePath: string
  title: string
  artists: string[]
  releaseDate: string
  genre: string
  subGenre: string

  audiusGenre?: Genre
}

type DDEXImage = {
  ref: string
  filePath: string
}

async function processZip(maybeZip: string) {
  if (maybeZip.endsWith('.zip')) {
    const tempDir = await mkdtemp(join(tmpdir(), 'ddex-'))
    await decompress(maybeZip, tempDir)
    await processDeliveryDir(tempDir)
  } else {
    await processDeliveryDir(maybeZip)
  }

  // await rm(tempDir, { recursive: true })
}

async function processDeliveryDir(dir: string) {
  const files = await readdir(dir, { recursive: true })

  const xmlFiles = files
    .filter((f) => f.toLowerCase().endsWith('.xml'))
    .map((f) => join(dir, f))

  for (const xmlFile of xmlFiles) {
    await processXmlFile(xmlFile)
  }
}

async function processXmlFile(ddexXmlLocation: string) {
  console.log('processing:', ddexXmlLocation)
  const xmlText = await readFile(ddexXmlLocation, 'utf8')
  const $ = cheerio.load(xmlText, { xmlMode: true })

  // helpers

  function toTexts($doc: CH) {
    return $doc.map((_, el) => $(el).text()).get()
  }

  function resolveFile($el: CH) {
    return resolve(
      ddexXmlLocation,
      '..',
      $el.find('FilePath').text(),
      $el.find('FileName').text()
    )
  }

  // index resources

  const soundResources: Record<string, DDEXSoundRecording> = {}
  const imageResources: Record<string, DDEXImage> = {}

  $('SoundRecording').each((_, el) => {
    const $el = $(el)

    const recording: DDEXSoundRecording = {
      ref: $el.find('ResourceReference').text(),
      isrc: $el.find('ISRC').text(),
      filePath: resolveFile($el),
      title: $el.find('TitleText:first').text(),
      artists: toTexts($el.find('DisplayArtist PartyName FullName')),
      genre: $el.find('GenreText').text(),
      subGenre: $el.find('SubGenre').text(),
      releaseDate: $el
        .find('OriginalResourceReleaseDate, ResourceReleaseDate')
        .first()
        .text()
    }

    recording.audiusGenre = resolveAudiusGenre(
      recording.subGenre,
      recording.genre
    )

    soundResources[recording.ref] = recording
  })

  $('Image').each((_, el) => {
    const $el = $(el)

    const img = {
      ref: $el.find('ResourceReference').text(),
      filePath: resolveFile($el)
    }

    imageResources[img.ref] = img
  })

  // index releases

  const releases = $('Release')
    .toArray()
    .map((el) => {
      const $el = $(el)

      const release: DDEXRelease = {
        ref: $el.find('ReleaseReference').text(),
        isrc: $el.find('ISRC').text(),
        title: $el.find('ReferenceTitle TitleText').text(),
        subTitle: $el.find('ReferenceTitle SubTitle').text(),
        artists: toTexts($el.find('DisplayArtist PartyName FullName')),
        genre: $el.find('GenreText').text(),
        subGenre: $el.find('SubGenre').text(),
        releaseDate: $el.find('ReleaseDate').text(),
        releaseType: $el.find('ReleaseType').text(),

        isMainRelease: $el.attr('IsMainRelease') == 'true',

        soundRecordings: [],
        images: []
      }

      release.audiusGenre = resolveAudiusGenre(release.subGenre, release.genre)

      // resolve resources
      $el
        .find('ReleaseResourceReferenceList > ReleaseResourceReference')
        .each((_, el) => {
          const ref = $(el).text()

          if (soundResources[ref]) {
            release.soundRecordings.push(soundResources[ref])
          } else if (imageResources[ref]) {
            release.images.push(imageResources[ref])
          } else {
            console.warn('resource not found', ref)
          }
        })

      return release
    })

  // all done!
  console.log(JSON.stringify(releases, undefined, 2))

  // sdk time!
  const svc = await createSdkService()
  const sdk = svc.getSdk()

  for (const release of releases) {
    // todo: what to do when no image
    if (!release.images.length) {
      continue
    }
    const imageFile = await readFileToBuffer(release.images[0].filePath)

    for (const track of release.soundRecordings) {
      const trackFile = await readFileToBuffer(track.filePath)
      const audiusGenre = track.audiusGenre || release.audiusGenre || Genre.ALL

      const uploadTrackRequest: UploadTrackRequest = {
        userId: 'KKa311z',
        metadata: {
          genre: audiusGenre,
          title: track.title
        },
        onProgress: (progress: any) => console.log('Progress:', progress),
        coverArtFile: imageFile,
        trackFile
      }
      console.log(`Uploading by  to Audius...`)
      const result = await sdk.tracks.uploadTrack(uploadTrackRequest)
      console.log(result)
    }
  }

  return releases
}

function resolveAudiusGenre(
  genre: string,
  subgenre: string
): Genre | undefined {
  // first try subgenre, then genre
  for (let searchTerm of [subgenre, genre]) {
    searchTerm = searchTerm.toLowerCase()
    for (const [k, v] of Object.entries(Genre)) {
      if (v.toLowerCase() == searchTerm) {
        return k as Genre
      }
    }
  }

  // maybe try some edit distance magic?
  // for now just log
  console.warn(`failed to resolve genre: subgenre=${subgenre} genre=${genre}`)
}

// sdk helpers
async function readFileToBuffer(filePath: string) {
  const buffer = await readFile(filePath)
  const name = basename(filePath)
  return { buffer, name }
}

// cleanup

async function cleanup() {
  let dirs = await readdir(tmpdir(), { recursive: false })
  const work = dirs
    .filter((dir) => dir.includes('ddex-'))
    .map((dir) => {
      dir = join(tmpdir(), dir)
      console.log('removing', dir)
      return rm(dir, { recursive: true })
    })
  await Promise.all(work)
}

// cli

const arg = process.argv[2]?.trim()
switch (arg) {
  case 'derp':
    console.log(resolveAudiusGenre('Blues', 'dunno'))
    break
  case '':
    console.log('specify path to ddex dir or zip')
    break
  case 'cleanup':
    cleanup()
    break
  default:
    processZip(arg)
}

/*

npx tsx scratch/zippy.ts ../ingester/e2e_test/fixtures/release_by_release/ern381/sony1.zip

../ingester/e2e_test/fixtures/batch/ern382/1_CPD1.zip

*/
