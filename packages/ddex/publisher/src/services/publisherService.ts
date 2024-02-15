import mongoose from 'mongoose'
import Deliveries from '../models/deliveries'
import PendingReleases from '../models/pendingReleases'
import PublishedReleases from '../models/publishedReleases'
import type {
  TrackMetadata,
  CollectionMetadata,
  CreateTrackRelease,
  CreateAlbumRelease,
} from '../models/pendingReleases'
import type {
  AudiusSdk as AudiusSdkType,
  UploadTrackRequest,
  UploadAlbumRequest,
  Genre,
  Mood,
} from '@audius/sdk/dist/sdk/index.d.ts'
import createS3 from './s3Service'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getUserId = async (audiusSdk: AudiusSdkType, artistName: string) => {
  // TODO: We previously did it like this, but the results are too random and don't return the user with an exact match as users[0].
  // In the future, we could check all OAuthed usernames for an exact match and cross-reference SDK's search results to find a rough match if no exact match was found
  // const { data: users } = await audiusSdk.users.searchUsers({
  //   query: artistName,
  // })
  // if (!users || users.length === 0) {
  //   throw new Error(`Could not find user ${artistName}`)
  // }
  // return users[0].id

  return 'E32yWR'
}

const formatTrackMetadata = (
  metadata: TrackMetadata
): UploadTrackRequest['metadata'] => {
  return {
    title: metadata.title,
    description: metadata.description || '',
    genre: metadata.genre as Genre,
    mood: (metadata.mood || 'Other') as Mood, // TODO: SDK requires mood, but XML doesn't provide one
    tags: metadata.tags || '',
    isrc: metadata.isrc,
    license: metadata.license,
    releaseDate: new Date(metadata.release_date),
    previewStartSeconds: metadata.preview_start_seconds ?? undefined,
    // isUnlisted: // TODO: set visibility
    // iswc:
    // origFilename:
    // isOriginalAvailable:
    // isStreamGated:
    // streamConditions:
    // isDownloadable:
    // isDownloadGated:
    // downloadConditions:
    // remixOf:
  }
}

const formatAlbumMetadata = (
  metadata: CollectionMetadata
): UploadAlbumRequest['metadata'] => {
  return {
    genre: metadata.genre as Genre,
    albumName: metadata.playlist_name,
    description: metadata.description || '',
    license: metadata.license || '',
    mood: (metadata.mood || 'Other') as Mood, // TODO: SDK requires mood, but XML doesn't provide one
    releaseDate: new Date(metadata.release_date),
    tags: metadata.tags || '',
    upc: metadata.upc || '',
  }
}

const uploadTrack = async (
  audiusSdk: AudiusSdkType,
  pendingTrack: CreateTrackRelease,
  s3Service: ReturnType<typeof createS3>
) => {
  const userId = await getUserId(audiusSdk, pendingTrack.metadata.artist_name)
  const metadata = formatTrackMetadata(pendingTrack.metadata)

  pendingTrack.metadata.cover_art_url =
    's3://ddex-dev-audius-indexed/65cc6ff94bc8f81560c8749e/resources/A10301A0005108088N_T-1027024165547_Image.jpg' // TODO: Remove after ensuring tracks always have cover art

  const coverArtDownload = await s3Service.downloadFromS3Indexed(
    pendingTrack.metadata.cover_art_url
  )
  // TODO: We can hash and verify against the metadata here
  const coverArtFile = {
    buffer: coverArtDownload!,
    originalname: pendingTrack.metadata.cover_art_url.split('/').pop(),
  }
  const trackDownload = await s3Service.downloadFromS3Indexed(
    pendingTrack.metadata.audio_file_url
  )
  const trackFile = {
    buffer: trackDownload!,
    originalname: pendingTrack.metadata.audio_file_url.split('/').pop(),
  }

  const uploadTrackRequest: UploadTrackRequest = {
    userId,
    coverArtFile,
    metadata,
    onProgress: (progress: any) => console.log('Progress:', progress),
    trackFile,
  }
  console.log(
    `Uploading ${pendingTrack.metadata.title} by ${pendingTrack.metadata.artist_name} to Audius...`
  )
  const result = await audiusSdk.tracks.uploadTrack(uploadTrackRequest)
  console.log(result)
  return result
}

const uploadAlbum = async (
  audiusSdk: AudiusSdkType,
  pendingAlbum: CreateAlbumRelease,
  s3Service: ReturnType<typeof createS3>
) => {
  // Fetch cover art from S3
  const coverArtDownload = await s3Service.downloadFromS3Indexed(
    pendingAlbum.metadata.cover_art_url
  )
  // TODO: We can hash and verify against the metadata here
  const coverArtFile = {
    buffer: coverArtDownload!,
    originalname: pendingAlbum.metadata.cover_art_url.split('/').pop(),
  }

  // Fetch track audio files from S3
  const trackFilesPromises = pendingAlbum.tracks.map(async (track) => {
    const trackDownload = await s3Service.downloadFromS3Indexed(
      track.audio_file_url
    )
    // TODO: We can hash and verify against the metadata here
    return {
      buffer: trackDownload!,
      originalname: track.audio_file_url.split('/').pop(),
    }
  })
  const trackFiles = await Promise.all(trackFilesPromises)

  const trackMetadatas = pendingAlbum.tracks.map(
    (trackMetadata: TrackMetadata) => formatTrackMetadata(trackMetadata)
  )

  // TODO: How can the parser know playlist_owner_id? Maybe we make the parser check OAuthed usernames for an exact match and hit Discovery's /v1/users/search endpoint to find a rough match if no exact match was found
  const userId = await getUserId(
    audiusSdk,
    /* pendingAlbum.metadata.playlist_owner_id */ ''
  )

  const uploadAlbumRequest: UploadAlbumRequest = {
    coverArtFile,
    metadata: formatAlbumMetadata(pendingAlbum.metadata),
    onProgress: (progress: any) => console.log('Progress:', progress),
    trackFiles,
    trackMetadatas,
    userId,
  }
  console.log(
    `Uploading ${pendingAlbum.metadata.playlist_name} by ${pendingAlbum.metadata.playlist_owner_id} to Audius...`
  )
  const result = await audiusSdk.albums.uploadAlbum(uploadAlbumRequest)
  console.log(result)
  return result
}

export const publishReleases = async (
  audiusSdk: AudiusSdkType,
  s3: ReturnType<typeof createS3>
) => {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const currentDate = new Date()

    const session = await mongoose.startSession()
    session.startTransaction()

    try {
      const documents = await PendingReleases.find({
        publish_date: { $lte: currentDate },
      }).session(session)

      for (const doc of documents) {
        let publishedData
        if (doc.create_track_release) {
          const uploadResult = await uploadTrack(
            audiusSdk,
            doc.create_track_release,
            s3
          )
          publishedData = {
            ...doc.toObject(),
            entity_id: uploadResult.trackId,
            blockhash: uploadResult.blockHash,
            blocknumber: uploadResult.blockNumber,
            created_at: new Date(),
          }
        } else if (doc.create_album_release) {
          const uploadResult = await uploadAlbum(
            audiusSdk,
            doc.create_album_release,
            s3
          )
          publishedData = {
            ...doc.toObject(),
            entity_id: uploadResult.albumId,
            blockhash: uploadResult.blockHash,
            blocknumber: uploadResult.blockNumber,
            created_at: new Date(),
          }
        } else {
          throw new Error('Missing track or album in pending release')
        }

        // Move document to 'published_releases' collection
        const publishedRelease = new PublishedReleases(publishedData)
        await publishedRelease.save({ session })
        await PendingReleases.deleteOne({ _id: doc._id }).session(session)
        // Update delivery_status to 'published' once all releases in the delivery are published
        const remainingCount = await PendingReleases.countDocuments({
          delivery_id: doc.delivery_id,
          _id: { $ne: doc._id },
        }).session(session)
        if (remainingCount === 0) {
          // Update delivery_status in deliveries collection
          await Deliveries.updateOne(
            { _id: doc.delivery_id },
            { $set: { delivery_status: 'published' } },
            { session }
          )
        }
        console.log('Published release: ', publishedData)
      }

      await session.commitTransaction()
    } catch (error) {
      console.error('Error publishing release, rolling back.', error)
      await session.abortTransaction()
    } finally {
      session.endSession()
    }

    // 10 seconds
    await new Promise((resolve) => setTimeout(resolve, 10000))
  }
}
