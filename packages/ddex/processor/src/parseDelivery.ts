import { Genre } from '@audius/sdk'
import * as cheerio from 'cheerio'
import decompress from 'decompress'
import { mkdtemp, readFile, readdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { releaseRepo, userRepo, xmlRepo } from './db'
import { omitEmpty } from './util'

type CH = cheerio.Cheerio<cheerio.Element>

export type DDEXRelease = {
  ref: string
  isrc?: string
  icpn?: string
  title: string
  subTitle?: string
  genre: string
  subGenre: string
  releaseDate: string
  releaseType: string
  releaseIds: {
    party_id?: string
    catalog_number?: string
    icpn?: string
    grid?: string
    isan?: string
    isbn?: string
    ismn?: string
    isrc?: string
    issn?: string
    istc?: string
    iswc?: string
    mwli?: string
    sici?: string
    proprietary_id?: string
  }

  isMainRelease: boolean
  audiusGenre?: Genre
  audiusUser?: string

  problems: string[]
  soundRecordings: DDEXSoundRecording[]
  images: DDEXResource[]
  deal?: AudiusSupportedDeal
} & ReleaseAndSoundRecordingSharedFields

type ReleaseAndSoundRecordingSharedFields = {
  copyrightLine?: CopyrightPair
  producerCopyrightLine?: CopyrightPair
  parentalWarningType?: string
  artists: DDEXContributor[]
  contributors: DDEXContributor[]
  indirectContributors: DDEXContributor[]
}

type CopyrightPair = {
  text: string
  year: string
}

export type DDEXContributor = {
  name: string
  role: string
}

export type DDEXResource = {
  ref: string
  filePath: string
  fileName: string
}

export type DDEXSoundRecording = {
  isrc?: string
  title: string
  releaseDate: string
  genre: string
  subGenre: string
  rightsController?: {
    name: string
    roles: string[]
    // rightShareUnknown: string
  }

  audiusGenre?: Genre
} & DDEXResource &
  ReleaseAndSoundRecordingSharedFields

type DealFields = {
  validityStartDate: string
  isDownloadable: boolean
}

export type DealFree = DealFields & {
  audiusDealType: 'Free'
}

export type DealPayGated = DealFields & {
  audiusDealType: 'PayGated'
  priceUsd: number
}

export type DealFollowGated = DealFields & {
  audiusDealType: 'FollowGated'
}

export type DealTipGated = DealFields & {
  audiusDealType: 'TipGated'
}

export type DealEthGated = DealFields & {
  audiusDealType: 'NFTGated'
  chain: 'eth'
  address: string
  standard?: string
  name: string
  slug?: string
  imageUrl?: string
  externalLink?: string
}

export type DealSolGated = DealFields & {
  audiusDealType: 'NFTGated'
  chain: 'sol'
  address: string
  name: string
  imageUrl?: string
  externalLink?: string
}

export type AudiusSupportedDeal =
  | DealFree
  | DealPayGated
  | DealFollowGated
  | DealTipGated
  | DealEthGated
  | DealSolGated

export async function parseDelivery(maybeZip: string) {
  if (maybeZip.endsWith('.zip')) {
    const tempDir = await mkdtemp(join(tmpdir(), 'ddex-'))
    await decompress(maybeZip, tempDir)
    return await processDeliveryDir(tempDir)
    // await rm(tempDir, { recursive: true })
  } else if (maybeZip.endsWith('.xml')) {
    return await parseDdexXmlFile(maybeZip)
  } else {
    return await processDeliveryDir(maybeZip)
  }
}

export async function reParsePastXml() {
  // loop over db xml and reprocess
  const rows = xmlRepo.all()
  for (const row of rows) {
    parseDdexXml(row.xmlUrl, row.xmlText)
  }
}

// recursively find + parse xml files in a dir
async function processDeliveryDir(dir: string) {
  const files = await readdir(dir, { recursive: true })

  const work = files
    .filter((f) => f.toLowerCase().endsWith('.xml'))
    .map((f) => join(dir, f))
    .map((f) => parseDdexXmlFile(f))

  return Promise.all(work)
}

// read xml from disk + parse
export async function parseDdexXmlFile(xmlUrl: string) {
  const xmlText = await readFile(xmlUrl, 'utf8')
  return parseDdexXml(xmlUrl, xmlText)
}

// actually parse ddex xml
export function parseDdexXml(xmlUrl: string, xmlText: string) {
  // todo: would be nice to skip this on reParse
  xmlRepo.upsert(xmlUrl, xmlText)

  const $ = cheerio.load(xmlText, { xmlMode: true })

  function toTexts($doc: CH) {
    return $doc.map((_, el) => $(el).text()).get()
  }

  function toText($el: CH) {
    return $el.first().text().trim()
  }

  function cline($el: CH) {
    const year = toText($el.find('CLine > Year'))
    const text = toText($el.find('CLine > CLineText'))
    if (year && text) return { year, text }
  }

  function pline($el: CH) {
    const year = toText($el.find('PLine > Year'))
    const text = toText($el.find('PLine > PLineText'))
    if (year && text) return { year, text }
  }

  function parseContributor(
    tagName:
      | 'DisplayArtist'
      | 'ResourceContributor'
      | 'IndirectResourceContributor',
    $el: CH
  ): DDEXContributor[] {
    const roleTagName =
      tagName == 'DisplayArtist' ? 'ArtistRole' : `${tagName}Role`

    return $el
      .find(tagName)
      .toArray()
      .map((el) => {
        const roleTag = $(el).find(roleTagName).first()
        return {
          name: toText($(el).find('FullName')),
          role: roleTag.attr('UserDefinedValue') || roleTag.text(),
        }
      })
  }

  //
  // parse deals
  //
  const releaseDeals: Record<string, AudiusSupportedDeal> = {}
  $('ReleaseDeal').each((_, el) => {
    const $el = $(el)
    const ref = $el.find('DealReleaseReference').text()
    $el.find('DealTerms').each((_, el) => {
      const $el = $(el)

      const cmt = $el.find('CommercialModelType')
      const commercialModelType = cmt.attr('UserDefinedValue') || cmt.text()
      const usageTypes = toTexts($el.find('UseType'))
      const territoryCode = toTexts($el.find('TerritoryCode'))

      // only consider Worldwide
      const isWorldwide = territoryCode.includes('Worldwide')
      if (!isWorldwide) {
        return
      }

      const common: DealFields = {
        isDownloadable: usageTypes.includes('PermanentDownload'),
        validityStartDate: $el.find('ValidityPeriod > StartDate').text(),
      }

      if (commercialModelType == 'FreeOfChargeModel') {
        releaseDeals[ref] = {
          ...common,
          audiusDealType: 'Free',
        }
      } else if (commercialModelType == 'PayAsYouGoModel') {
        const priceUsd = parseFloat(
          $el.find('WholesalePricePerUnit[CurrencyCode="USD"]').text()
        )
        if (priceUsd) {
          releaseDeals[ref] = {
            ...common,
            audiusDealType: 'PayGated',
            priceUsd,
          }
        }
      } else if (
        commercialModelType == 'FollowGated' ||
        commercialModelType == 'TipGated'
      ) {
        releaseDeals[ref] = {
          ...common,
          audiusDealType: commercialModelType,
        }
      } else if (commercialModelType == 'NFTGated') {
        const chain = $el.find('Chain').text()
        const address = $el.find('Address').text()
        const name = $el.find('Name').text()
        const imageUrl = $el.find('ImageUrl').text()
        const externalLink = $el.find('ExternalLink').text()

        // eth specific
        const standard = $el.find('Standard').text()
        const slug = $el.find('Slug').text()

        switch (chain) {
          case 'eth':
            releaseDeals[ref] = {
              ...common,
              audiusDealType: 'NFTGated',
              chain,
              address,
              name,
              imageUrl,
              externalLink,
              standard,
              slug,
            }
            break
          case 'sol':
            releaseDeals[ref] = {
              ...common,
              audiusDealType: 'NFTGated',
              chain,
              address,
              name,
              imageUrl,
              externalLink,
            }
            break
        }
      }
    })
  })

  //
  // parse resources
  //

  const soundResources: Record<string, DDEXSoundRecording> = {}
  const imageResources: Record<string, DDEXResource> = {}
  const textResources: Record<string, DDEXResource> = {}

  $('ResourceList > SoundRecording').each((_, el) => {
    const $el = $(el)

    const recording: DDEXSoundRecording = {
      ref: $el.find('ResourceReference').text(),
      isrc: $el.find('ISRC').text(),

      filePath: $el.find('FilePath').text(),
      fileName: $el.find('FileName').text(),
      title: $el.find('TitleText:first').text(),
      artists: parseContributor('DisplayArtist', $el),
      contributors: parseContributor('ResourceContributor', $el),
      indirectContributors: parseContributor(
        'IndirectResourceContributor',
        $el
      ),
      genre: $el.find('GenreText').text(),
      subGenre: $el.find('SubGenre').text(),
      releaseDate: $el
        .find('OriginalResourceReleaseDate, ResourceReleaseDate')
        .first()
        .text(),

      copyrightLine: cline($el),
      producerCopyrightLine: pline($el),
      parentalWarningType: toText($el.find('ParentalWarningType')),
    }

    const rightsController = $el.find('RightsController').first()
    if (rightsController.length) {
      recording.rightsController = {
        name: toText(rightsController.find('PartyName FullName')),
        roles: toTexts(rightsController.find('RightsControllerRole')),
        // rightShareUnknown: toText(rightsController.find('RightShareUnknown'))
      }
    }

    recording.audiusGenre = resolveAudiusGenre(
      recording.subGenre,
      recording.genre
    )

    soundResources[recording.ref] = recording
  })

  function ddexResourceReducer(acc: Record<string, DDEXResource>, el: any) {
    const [ref, filePath, fileName] = [
      'ResourceReference',
      'FilePath',
      'FileName',
    ].map((k) => $(el).find(k).text())
    acc[ref] = { ref, filePath, fileName }
    return acc
  }

  $('ResourceList > Image')
    .toArray()
    .reduce(ddexResourceReducer, imageResources)

  $('ResourceList > Text').toArray().reduce(ddexResourceReducer, textResources)

  //
  // parse releases
  //

  const releases = $('Release')
    .toArray()
    .map((el) => {
      const $el = $(el)

      const ref = $el.find('ReleaseReference').text()
      const deal = releaseDeals[ref]

      const releaseDate =
        deal?.validityStartDate ||
        $el.find('ReleaseDate').text() ||
        $el.find('GlobalOriginalReleaseDate').text()

      const release: DDEXRelease = {
        ref,
        isrc: $el.find('ISRC').text(),
        icpn: $el.find('ICPN').text(),
        title: $el.find('ReferenceTitle TitleText').text(),
        subTitle: $el.find('ReferenceTitle SubTitle').text(),
        artists: parseContributor('DisplayArtist', $el),
        contributors: parseContributor('ResourceContributor', $el),
        indirectContributors: parseContributor(
          'IndirectResourceContributor',
          $el
        ),
        genre: $el.find('GenreText').text(),
        subGenre: $el.find('SubGenre').text(),
        releaseIds: parseReleaseIds($el),
        releaseDate,
        releaseType: $el.find('ReleaseType').text(),

        copyrightLine: cline($el),
        producerCopyrightLine: pline($el),
        parentalWarningType: toText($el.find('ParentalWarningType')),

        isMainRelease: $el.attr('IsMainRelease') == 'true',

        problems: [],
        soundRecordings: [],
        images: [],
        deal,
      }

      // resolve audius genre
      release.audiusGenre = resolveAudiusGenre(release.subGenre, release.genre)
      if (!release.audiusGenre) {
        release.problems.push(`NoGenre`)
      }

      // resolve audius user
      const artistNames = release.artists.map((a) => a.name)
      release.audiusUser = userRepo.match(artistNames)
      if (!release.audiusUser) {
        release.problems.push(`NoUser`)
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
          } else if (textResources[ref]) {
            console.log('ignoring text ref', ref)
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
  for (const release of releases) {
    releaseRepo.upsert(xmlUrl, release)
  }

  return releases
}

//
// helpers
//

function toText($el: CH) {
  return $el.first().text().trim()
}

export function parseReleaseIds($el: CH): DDEXRelease['releaseIds'] {
  return omitEmpty({
    party_id: toText($el.find('ReleaseId > PartyId')),
    catalog_number: toText($el.find('ReleaseId > CatalogNumber')),
    icpn: toText($el.find('ReleaseId > ICPN')),
    grid: toText($el.find('ReleaseId > GRid')),
    isan: toText($el.find('ReleaseId > ISAN')),
    isbn: toText($el.find('ReleaseId > ISBN')),
    ismn: toText($el.find('ReleaseId > ISMN')),
    isrc: toText($el.find('ReleaseId > ISRC')),
    issn: toText($el.find('ReleaseId > ISSN')),
    istc: toText($el.find('ReleaseId > ISTC')),
    iswc: toText($el.find('ReleaseId > ISWC')),
    mwli: toText($el.find('ReleaseId > MWLI')),
    sici: toText($el.find('ReleaseId > SICI')),
    proprietary_id: toText($el.find('ReleaseId > ProprietaryId')),
  })
}

function resolveAudiusGenre(
  genre: string,
  subgenre: string
): Genre | undefined {
  if (!genre && !subgenre) {
    return
  }

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
