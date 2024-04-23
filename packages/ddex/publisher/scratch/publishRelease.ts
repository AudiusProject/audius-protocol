import { UploadTrackRequest, Genre, UploadAlbumRequest } from '@audius/sdk'
import { createSdkService } from '../src/services/sdkService'
import { DDEXRelease } from './parseDelivery'
import { readFile } from 'fs/promises'
import { basename, join, resolve } from 'path'
import { ReleaseRow, db, upsertRelease } from './db'
import { dialS3 } from './s3poller'
import { GetObjectCommand } from '@aws-sdk/client-s3'

export async function publishValidPendingReleases() {
  const rows = db.prepare(`select * from releases`).all() as ReleaseRow[]
  for (const row of rows) {
    const parsed = JSON.parse(row.json)
    if (parsed.problems.length) {
      console.log(`skipping ${row.key} due to problems: `, parsed.problems)
    } else if (row.entityId) {
      console.log(`skipping ${row.key} already published`)
    } else {
      await publishRelease(row)
    }
  }
}

export async function publishRelease(releaseRow: ReleaseRow) {
  const sdkService = createSdkService()
  const sdk = (await sdkService).getSdk()
  const s3 = dialS3()

  const skipSdkPublish = process.env.SKIP_SDK_PUBLISH == 'true'

  const release = JSON.parse(releaseRow.json) as DDEXRelease

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
          Key: s3url.pathname.substring(1)
        })
      )
      const byteArr = await Body!.transformToByteArray()
      const buffer = Buffer.from(byteArr)
      return {
        name: fileName,
        buffer
      }
    }

    const fileUrl = resolve(releaseRow.xmlUrl!, '..', filePath, fileName)
    return readFileToBuffer(fileUrl)
  }

  const imageFile = await resolveFile(release.images[0])

  const trackFiles = await Promise.all(
    release.soundRecordings.map((track) => resolveFile(track))
  )

  const trackMetadatas: UploadTrackRequest['metadata'][] =
    release.soundRecordings.map((sound) => {
      const audiusGenre = sound.audiusGenre || release.audiusGenre || Genre.ALL

      const releaseDate =
        new Date(sound.releaseDate) ||
        new Date(release.releaseDate) ||
        new Date()

      return {
        genre: audiusGenre,
        title: sound.title,
        isrc: release.isrc,
        releaseDate
        // todo: more track fields
      }
    })

  // publish album
  if (release.soundRecordings.length > 1) {
    // todo: actually find actual userId based on oauth
    const userId = 'KKa311z'

    const uploadAlbumRequest: UploadAlbumRequest = {
      coverArtFile: imageFile,
      metadata: {
        genre: release.audiusGenre || Genre.ALL,
        albumName: release.title
        // todo: more album fields
      },
      trackFiles,
      trackMetadatas,
      userId
    }

    if (skipSdkPublish) {
      console.log('skipping sdk publish')
      return
    }

    console.log(`Uploading ALBUM ${release.title} to Audius...`)
    const result = await sdk.albums.uploadAlbum(uploadAlbumRequest)
    console.log(result)

    // on success set publishedAt, entityId, blockhash
    db.prepare(
      `update releases set entityId=?, blockNumber=?, blockHash=?, publishedAt=?
       where key=?`
    )
      .bind(
        result.albumId,
        result.blockNumber,
        result.blockHash,
        new Date().toISOString(),
        releaseRow.key
      )
      .run()

    // return result
  }

  // publish track
  if (trackFiles[0]) {
    // todo: actually find actual userId based on who dun oauthed
    const userId = 'KKa311z'

    const metadata = trackMetadatas[0]
    const trackFile = trackFiles[0]

    const uploadTrackRequest: UploadTrackRequest = {
      userId,
      metadata,
      coverArtFile: imageFile,
      trackFile
    }

    if (skipSdkPublish) {
      console.log('skipping sdk publish')
      return
    }

    console.log(`Uploading track ${metadata.title} Audius...`)
    const result = await sdk.tracks.uploadTrack(uploadTrackRequest)
    console.log(result)

    // on succes: update releases
    db.prepare(
      `update releases set entityId=?, blockNumber=?, blockHash=?, publishedAt=?
       where key=?`
    )
      .bind(
        result.trackId,
        result.blockNumber,
        result.blockHash,
        new Date().toISOString(),
        releaseRow.key
      )
      .run()
  }
}

// sdk helpers
async function readFileToBuffer(filePath: string) {
  const buffer = await readFile(filePath)
  const name = basename(filePath)
  return { buffer, name }
}
