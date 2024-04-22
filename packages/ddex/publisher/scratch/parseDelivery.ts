import * as cheerio from 'cheerio'
import { Genre } from '@audius/sdk'
import decompress from 'decompress'
import { mkdtemp, readFile, readdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { ReleaseRow, db, matchAudiusUser, upsertRelease } from './db'

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

  problems: string[]
  soundRecordings: DDEXSoundRecording[]
  images: DDEXImage[]
}

export type DDEXSoundRecording = {
  ref: string
  isrc?: string
  filePath: string
  fileName: string
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
  fileName: string
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

export async function reParsePastXml() {
  // loop over db xml and reprocess
  const releases = db.prepare(`select * from releases`).all() as ReleaseRow[]
  for (const release of releases) {
    // skip releases that have already been published
    if (release.publishedAt) {
      continue
    }
    await parseDdexXml(release.xmlUrl || '', release.xmlText)
  }
}

async function processDeliveryDir(dir: string) {
  const files = await readdir(dir, { recursive: true })

  const xmlFiles = files
    .filter((f) => f.toLowerCase().endsWith('.xml'))
    .map((f) => join(dir, f))

  // actual publish step...
  // todo: move this to some poller thing
  for (const xmlFile of xmlFiles) {
    await parseDdexXmlFile(xmlFile)
  }
}

export async function parseDdexXmlFile(xmlUrl: string) {
  const xmlText = await readFile(xmlUrl, 'utf8')
  return parseDdexXml(xmlUrl, xmlText)
}

export async function parseDdexXml(xmlUrl: string, xmlText: string) {
  const $ = cheerio.load(xmlText, { xmlMode: true })

  function toTexts($doc: CH) {
    return $doc.map((_, el) => $(el).text()).get()
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

      filePath: $el.find('FilePath').text(),
      fileName: $el.find('FileName').text(),
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
    const ref = $el.find('ResourceReference').text()

    imageResources[ref] = {
      ref,
      filePath: $el.find('FilePath').text(),
      fileName: $el.find('FileName').text()
    }
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

        problems: [],
        soundRecordings: [],
        images: []
      }

      release.audiusGenre = resolveAudiusGenre(release.subGenre, release.genre)
      if (!release.audiusGenre) {
        release.problems.push(`GenreMatchFailed`)
      }

      // resolve audius user
      release.audiusUser = matchAudiusUser(release.artists)
      if (!release.audiusUser) {
        release.problems.push(`UserMatchFailed`)
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
            release.problems.push(`MissingRef: ${ref}`)
          }
        })

      return release
    })

  // resolve any missing images to main release if possible
  const mainRelease = releases.find((r) => r.isMainRelease)
  for (const release of releases) {
    if (!release.images.length) {
      if (mainRelease?.images.length) {
        release.images = mainRelease.images
      } else {
        release.problems.push('NoImage')
      }
    }
  }

  // create or replace this release in db
  // todo: should have some kind of xml source path thing...
  for (const release of releases) {
    upsertRelease(xmlUrl, xmlText, release)
  }

  return releases
}

//
// helpers
//

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

  // hard code some genre matching??
  if (subgenre == 'Dance') {
    return Genre.ELECTRONIC
  }

  // maybe try some edit distance magic?
  // for now just log
  console.warn(`failed to resolve genre: subgenre=${subgenre} genre=${genre}`)
}
