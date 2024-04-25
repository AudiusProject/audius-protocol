import {
  UploadTrackRequest,
  Genre,
  UploadAlbumRequest,
  AudiusSdk,
} from '@audius/sdk'
import { createSdkService } from '../src/services/sdkService'
import { DDEXRelease } from './parseDelivery'
import { readFile } from 'fs/promises'
import { basename, join, resolve } from 'path'
import { ReleaseRow, dbUpdate, releaseRepo } from './db'
import { dialS3 } from './s3poller'
import { GetObjectCommand } from '@aws-sdk/client-s3'

export async function publishValidPendingReleases() {
  const sdkService = createSdkService()
  const sdk = (await sdkService).getSdk()
  const rows = releaseRepo.all()

  for (const row of rows) {
    const parsed = row._parsed!

    // todo: hardcoding to my staging user ID to make e2e publish easier
    // todo: remove
    parsed.audiusUser = 'KKa311z'

    if (parsed.problems.length) {
      console.log(`skipping ${row.key} due to problems: `, parsed.problems)
    } else if (row.entityId) {
      // this will issue a SDK track update every time you run `publish`
      // which is not what we want really, but is useful if you are adding new fields
      // and want to verify they come back from the API.
      // if we did want something like this it'd probably be some `--force` cli thing
      if (row.entityType == 'track') {
        await updateTrack(sdk, row, parsed)
      } else {
        console.log('already published, skipping', row.key)
      }
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

  const s3 = dialS3()

  const skipSdkPublish = process.env.SKIP_SDK_PUBLISH == 'true'

  if (!releaseRow.xmlUrl) {
    throw new Error(`xmlUrl is required to resolve file paths`)
  }

  // read asset file from disk or s3
  // depending on source xml location.
  // todo: for s3 would be nice to save to local fs
  //   since assets are reused between releases (image, audio)
  //   would be nice to not download it every time
  type hasFile = {
    filePath: string
    fileName: string
  }
  async function resolveFile({ filePath, fileName }: hasFile) {
    if (releaseRow.xmlUrl?.startsWith('s3:')) {
      const s3url = new URL(`${filePath}${fileName}`, releaseRow.xmlUrl)
      const { Body } = await s3.send(
        new GetObjectCommand({
          Bucket: s3url.host,
          Key: s3url.pathname.substring(1),
        })
      )
      const byteArr = await Body!.transformToByteArray()
      const buffer = Buffer.from(byteArr)
      return {
        name: fileName,
        buffer,
      }
    }

    const fileUrl = resolve(releaseRow.xmlUrl!, '..', filePath, fileName)
    return readFileToBuffer(fileUrl)
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
    dbUpdate('releases', 'key', {
      key: releaseRow.key,
      entityType: 'track',
      entityId: result.trackId,
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
