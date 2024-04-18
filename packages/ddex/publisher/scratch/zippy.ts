import 'dotenv/config'

import decompress from 'decompress'
import { mkdtemp, readFile, readdir, rm, rmdir, unlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import * as cheerio from 'cheerio'

type CH = cheerio.Cheerio<cheerio.Element>

type DDEXRelease = {
  ref: string
  isrc?: string
  title: string
  subTitle?: string
  artists: string[]
  genre: string
  subGenre?: string
  releaseDate?: string
  releaseType: string

  isMainRelease: boolean

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

    const recording = {
      ref: $el.find('ResourceReference').text(),
      isrc: $el.find('ISRC').text(),
      filePath: resolveFile($el),
      title: $el.find('TitleText:first').text(),
      artists: toTexts($el.find('DisplayArtist PartyName FullName')),
      releaseDate: $el
        .find('OriginalResourceReleaseDate, ResourceReleaseDate')
        .first()
        .text()
    }

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

  return releases
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
