import { UploadTrackRequest, Genre, UploadAlbumRequest } from '@audius/sdk'
import { createSdkService } from '../src/services/sdkService'
import { DDEXRelease } from './parseDelivery'
import { readFile } from 'fs/promises'
import { basename } from 'path'

export async function publishRelease(release: DDEXRelease) {
  if (process.env.SKIP_SDK_PUBLISH) {
    console.log('skipping sdk publish')
    return
  }
  const sdkService = createSdkService()
  const sdk = (await sdkService).getSdk()

  const imageFile = await readFileToBuffer(release.images[0].filePath)

  const trackFiles = await Promise.all(
    release.soundRecordings.map((track) => readFileToBuffer(track.filePath))
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
    console.log(`Uploading ALBUM ${release.title} to Audius...`)
    const result = await sdk.albums.uploadAlbum(uploadAlbumRequest)
    console.log(result)

    // on succes: update releases set entityId = ${result.albumId} where id = ${someReleaseId}

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
