import { UploadTrackRequest, Genre, UploadAlbumRequest } from '@audius/sdk'
import { createSdkService } from '../src/services/sdkService'
import { DDEXRelease } from './parseDelivery'
import { readFile } from 'fs/promises'
import { basename, resolve } from 'path'
import { ReleaseRow, db } from './db'

export async function publishValidPendingReleases() {
  const rows = db.prepare(`select * from releases`).all() as ReleaseRow[]
  for (const row of rows) {
    const release = JSON.parse(row.json)
    if (release.problems.length) {
      console.log(`skipping ${release.ref} due to problems: `, release.problems)
    }
    await publishRelease(row)
  }
}

export async function publishRelease(releaseRow: ReleaseRow) {
  const sdkService = createSdkService()
  const sdk = (await sdkService).getSdk()

  const skipSdkPublish = process.env.SKIP_SDK_PUBLISH == 'true'

  const release = JSON.parse(releaseRow.json) as DDEXRelease

  if (!releaseRow.xmlUrl) {
    throw new Error(`xmlUrl is required to resolve file paths`)
  }

  // todo: if this is an s3 url... need to sync s3 assets to local disk first
  // or support s3 urls when opening asset
  function resolveFile({
    filePath,
    fileName
  }: {
    filePath: string
    fileName: string
  }) {
    return resolve(releaseRow.xmlUrl!, '..', filePath, fileName)
  }

  const imageFile = await readFileToBuffer(resolveFile(release.images[0]))

  const trackFiles = await Promise.all(
    release.soundRecordings.map((track) => readFileToBuffer(resolveFile(track)))
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

    // todo: on success set publishedAt, entityId, blockhash

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

    // on succes: update releases set entityId = ${result.trackId} where id = ${someReleaseId}
  }
}

// sdk helpers
async function readFileToBuffer(filePath: string) {
  const buffer = await readFile(filePath)
  const name = basename(filePath)
  return { buffer, name }
}
