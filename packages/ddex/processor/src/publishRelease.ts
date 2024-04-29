import {
  AudiusSdk,
  Genre,
  UploadAlbumRequest,
  UploadTrackRequest,
} from '@audius/sdk'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { mkdir, readFile, stat, writeFile } from 'fs/promises'
import { basename, dirname, join, resolve } from 'path'
import {
  ReleaseProcessingStatus,
  ReleaseRow,
  dbUpdate,
  releaseRepo,
} from './db'
import { DDEXRelease, DDEXResource } from './parseDelivery'
import { dialS3 } from './s3poller'
import { createSdkService } from './sdk'

const sdkService = createSdkService()

export async function publishValidPendingReleases() {
  const rows = releaseRepo.all({ pendingPublish: true })
  if (!rows.length) return

  const sdk = (await sdkService).getSdk()

  for (const row of rows) {
    const parsed = row._parsed!

    // todo: hardcoding to my staging user ID to make e2e publish easier
    // todo: remove
    parsed.audiusUser = 'KKa311z'

    if (row.entityId) {
      // this release has already been published, and has an entity ID.
      // for now just move on:
      console.log('already published, skipping', row.key)
      releaseRepo.update({
        key: row.key,
        status: ReleaseProcessingStatus.Published,
      })

      // todo: updates
      // simplest way... if parsedJson != publishedJson issue update
      //    the risk being that this might incite a ton of needless updates if not careful
      // could do... if xmlUrl != publishedXmlUrl
      //    but that wouldn't handle code change type of thing

      // if (row.entityType == 'track') {
      //   await updateTrack(sdk, row, parsed)
      // } else {
      //   console.log('already published, skipping', row.key)
      // }
    } else {
      // publish new release
      try {
        await publishRelease(sdk, row, parsed)
      } catch (e: any) {
        console.log('failed to publish', row.key, e)
        releaseRepo.addPublishError(row.key, e)
      }
    }
  }
}

export async function publishRelease(
  sdk: AudiusSdk,
  releaseRow: ReleaseRow,
  release: DDEXRelease
) {
  if (new Date(release.releaseDate) > new Date()) {
    console.log(
      `Skipping future release: ${releaseRow.key} ${release.releaseDate}`
    )
    return
  }

  const skipSdkPublish = process.env.SKIP_SDK_PUBLISH == 'true'

  if (!releaseRow.xmlUrl) {
    throw new Error(`xmlUrl is required to resolve file paths`)
  }

  // read asset file
  async function resolveFile({ filePath, fileName }: DDEXResource) {
    return readAssetWithCaching(releaseRow.xmlUrl, filePath, fileName)
  }

  const imageFile = await resolveFile(release.images[0])

  const trackFiles = await Promise.all(
    release.soundRecordings.map((track) => resolveFile(track))
  )

  const trackMetadatas = prepareTrackMetadatas(release)

  // publish album
  if (release.soundRecordings.length > 1) {
    const uploadAlbumRequest: UploadAlbumRequest = {
      coverArtFile: imageFile,
      metadata: {
        genre: release.audiusGenre || Genre.ALL,
        albumName: release.title,
        // todo: more album fields
      },
      trackFiles,
      trackMetadatas,
      userId: release.audiusUser!,
    }

    if (skipSdkPublish) {
      console.log('skipping sdk publish')
      return
    }

    console.log(`Uploading ALBUM ${release.title} to Audius...`)
    const result = await sdk.albums.uploadAlbum(uploadAlbumRequest)
    console.log(result)

    // on success set publishedAt, entityId, blockhash
    dbUpdate('releases', 'key', {
      key: releaseRow.key,
      status: 'Published',
      entityType: 'album',
      entityId: result.albumId,
      blockNumber: result.blockNumber,
      blockHash: result.blockHash,
      publishedAt: new Date().toISOString(),
    })

    // return result
  } else if (trackFiles[0]) {
    // publish track

    const metadata = trackMetadatas[0]
    const trackFile = trackFiles[0]

    const uploadTrackRequest: UploadTrackRequest = {
      userId: release.audiusUser!,
      metadata,
      coverArtFile: imageFile,
      trackFile,
    }

    if (skipSdkPublish) {
      console.log('skipping sdk publish')
      return
    }

    console.log(`Uploading track ${metadata.title} Audius...`)
    const result = await sdk.tracks.uploadTrack(uploadTrackRequest)
    console.log(result)

    // on succes: update releases
    releaseRepo.update({
      key: releaseRow.key,
      status: ReleaseProcessingStatus.Published,
      entityType: 'track',
      entityId: result.trackId!,
      blockNumber: result.blockNumber,
      blockHash: result.blockHash,
      publishedAt: new Date().toISOString(),
    })
  }
}

async function updateTrack(
  sdk: AudiusSdk,
  row: ReleaseRow,
  release: DDEXRelease
) {
  const metas = prepareTrackMetadatas(release)

  const result = await sdk.tracks.updateTrack({
    userId: release.audiusUser!,
    trackId: row.entityId!,
    metadata: metas[0],
  })

  console.log('UPDATE', result)
}

function prepareTrackMetadatas(release: DDEXRelease) {
  const trackMetas: UploadTrackRequest['metadata'][] =
    release.soundRecordings.map((sound) => {
      const audiusGenre = sound.audiusGenre || release.audiusGenre || Genre.ALL

      const releaseDate =
        new Date(sound.releaseDate) ||
        new Date(release.releaseDate) ||
        new Date()

      // use sound copyright, fallback to release copyright
      const copyrightLine = sound.copyrightLine || release.copyrightLine
      const producerCopyrightLine =
        sound.producerCopyrightLine || release.producerCopyrightLine
      const parentalWarningType =
        sound.parentalWarningType || release.parentalWarningType

      return {
        genre: audiusGenre,
        title: sound.title,
        isrc: release.isrc,
        releaseDate,
        copyrightLine,
        producerCopyrightLine,
        parentalWarningType,
        rightsController: sound.rightsController,
      }
    })

  return trackMetas
}

// sdk helpers
async function readFileToBuffer(filePath: string) {
  const buffer = await readFile(filePath)
  const name = basename(filePath)
  return { buffer, name }
}

//
// s3 file helper
//
export async function readAssetWithCaching(
  xmlUrl: string,
  filePath: string,
  fileName: string
) {
  // read from s3 + cache to local disk
  if (xmlUrl.startsWith('s3:')) {
    const cacheBaseDir = `/tmp/ddex_cache`
    const s3url = new URL(`${filePath}${fileName}`, xmlUrl)
    const Bucket = s3url.host
    const Key = s3url.pathname.substring(1)
    const destinationPath = join(cacheBaseDir, Bucket, Key)

    // fetch if needed
    const exists = await fileExists(destinationPath)
    if (!exists) {
      const s3 = dialS3()
      await mkdir(dirname(destinationPath), { recursive: true })
      const { Body } = await s3.send(new GetObjectCommand({ Bucket, Key }))
      await writeFile(destinationPath, Body as any)
    }

    return readFileToBuffer(destinationPath)
  }

  // read from local disk
  const fileUrl = resolve(xmlUrl, '..', filePath, fileName)
  return readFileToBuffer(fileUrl)
}

async function fileExists(path: string) {
  try {
    await stat(path)
    return true
  } catch {
    return false
  }
}
