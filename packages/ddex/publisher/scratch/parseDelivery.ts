import * as cheerio from 'cheerio'
import { Genre } from '@audius/sdk'
import decompress from 'decompress'
import { mkdtemp, readFile, readdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { publishRelease } from './publishRelease'
import { matchAudiusUser, upsertRelease } from './db'

type CH = cheerio.Cheerio<cheerio.Element>

export type DDEXRelease = {
  ref: string
  isrc?: string
  icpn?: string
  title: string
  subTitle?: string
  artists: string[]
  genre: string
  subGenre: string
  releaseDate: string
  releaseType: string

  isMainRelease: boolean
  audiusGenre?: Genre
  audiusUser?: string

  soundRecordings: DDEXSoundRecording[]
  images: DDEXImage[]
}

export type DDEXSoundRecording = {
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

export type DDEXImage = {
  ref: string
  filePath: string
}

export async function parseDelivery(maybeZip: string) {
  if (maybeZip.endsWith('.zip')) {
    const tempDir = await mkdtemp(join(tmpdir(), 'ddex-'))
    await decompress(maybeZip, tempDir)
    await processDeliveryDir(tempDir)
    // await rm(tempDir, { recursive: true })
  } else {
    await processDeliveryDir(maybeZip)
  }
}

async function processDeliveryDir(dir: string) {
  const files = await readdir(dir, { recursive: true })

  const xmlFiles = files
    .filter((f) => f.toLowerCase().endsWith('.xml'))
    .map((f) => join(dir, f))

  // actual publish step...
  // move this to caller
  for (const xmlFile of xmlFiles) {
    const releases = await parseDdexXmlFile(xmlFile)
    for (const release of releases) {
      // todo: what to do when no image
      if (!release.images.length) continue
      await publishRelease(release)
    }
  }
}

export async function parseDdexXmlFile(ddexXmlLocation: string) {
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

  //
  // parse resources
  //

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

  //
  // parse releases
  //

  const releases = $('Release')
    .toArray()
    .map((el) => {
      const $el = $(el)

      const release: DDEXRelease = {
        ref: $el.find('ReleaseReference').text(),
        isrc: $el.find('ISRC').text(),
        icpn: $el.find('ICPN').text(),
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

      // resolve audius user
      release.audiusUser = matchAudiusUser(release.artists)
      console.log('-----------', release.audiusGenre, release.audiusUser)

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

      // create or replace this release
      upsertRelease(xmlText, release)

      return release
    })

  return releases
}

function resolveAudiusGenre(
  genre: string,
  subgenre: string
): Genre | undefined {
  // first try subgenre, then genre
  for (let searchTerm of [subgenre, genre]) {
    searchTerm = searchTerm.toLowerCase()
    for (const v of Object.values(Genre)) {
      if (v.toLowerCase() == searchTerm) {
        return v
      }
    }
  }

  // maybe try some edit distance magic?
  // for now just log
  console.warn(`failed to resolve genre: subgenre=${subgenre} genre=${genre}`)
}
