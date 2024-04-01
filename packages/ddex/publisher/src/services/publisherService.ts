import mongoose from 'mongoose'
import PendingReleases from '../models/pendingReleases'
import PublishedReleases from '../models/publishedReleases'
import type {
  TrackMetadata,
  CollectionMetadata,
  CreateTrackRelease,
  CreateAlbumRelease,
  PendingRelease,
} from '../models/pendingReleases'
import type {
  AudiusSdk as AudiusSdkType,
  UploadTrackRequest,
  UploadAlbumRequest,
  Genre,
  Mood,
} from '@audius/sdk'
import createS3 from './s3Service'

const formatTrackMetadata = (
  metadata: TrackMetadata
): UploadTrackRequest['metadata'] => {
  return {
    title: metadata.title,
    description: metadata.description || '',
    genre: metadata.genre as Genre,
    ...(metadata.mood && { mood: metadata.mood as Mood }),
    tags: metadata.tags || '',
    isrc: metadata.isrc,
    license: metadata.license,
    releaseDate: new Date(metadata.release_date),
    ddexReleaseIds: metadata.ddex_release_ids,
    previewStartSeconds: metadata.preview_start_seconds ?? undefined,
    artists: metadata.artists,
    resourceContributors: metadata.resource_contributors,
    indirectResourceContributors: metadata.indirect_resource_contributors,
    rightsController: metadata.rights_controller?.name
      ? {
          ...metadata.rights_controller,
          roles: metadata.rights_controller?.roles ?? [],
        }
      : null,
    copyrightLine: metadata.copyright_line,
    producerCopyrightLine: metadata.producer_copyright_line,
    parentalWarningType: metadata.parental_warning_type,
    isStreamGated: metadata.is_stream_gated,
    streamConditions: metadata.stream_conditions,
    isDownloadGated: metadata.is_download_gated,
    downloadConditions: metadata.download_conditions,
    // isUnlisted: // TODO: set visibility
    // iswc:
    // origFilename:
    // isOriginalAvailable:
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
    mood: (metadata.mood || 'Other') as Mood, // SDK requires mood, but XML doesn't provide one
    releaseDate: new Date(metadata.release_date),
    ddexReleaseIds: metadata.ddex_release_ids,
    tags: metadata.tags || '',
    upc: metadata.upc || '',
    artists: metadata.artists,
    copyrightLine: metadata.copyright_line,
    producerCopyrightLine: metadata.producer_copyright_line,
    parentalWarningType: metadata.parental_warning_type,
  }
}

const uploadTrack = async (
  audiusSdk: AudiusSdkType,
  pendingTrack: CreateTrackRelease,
  s3Service: ReturnType<typeof createS3>
) => {
  const userId = pendingTrack.metadata.artist_id
  const metadata = formatTrackMetadata(pendingTrack.metadata)

  const coverArtDownload = await s3Service.downloadFromS3Crawled(
    pendingTrack.metadata.cover_art_url
  )
  // TODO: We can hash and verify against the metadata here
  const coverArtFile = {
    buffer: coverArtDownload!,
    originalname: pendingTrack.metadata.cover_art_url.split('/').pop(),
  }
  const trackDownload = await s3Service.downloadFromS3Crawled(
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
  const coverArtDownload = await s3Service.downloadFromS3Crawled(
    pendingAlbum.metadata.cover_art_url
  )
  // TODO: We can hash and verify against the metadata here
  const coverArtFile = {
    buffer: coverArtDownload!,
    originalname: pendingAlbum.metadata.cover_art_url.split('/').pop(),
  }

  // Fetch track audio files from S3
  const trackFilesPromises = pendingAlbum.tracks.map(async (track) => {
    const trackDownload = await s3Service.downloadFromS3Crawled(
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

  const uploadAlbumRequest: UploadAlbumRequest = {
    coverArtFile,
    metadata: formatAlbumMetadata(pendingAlbum.metadata),
    onProgress: (progress: any) => console.log('Progress:', progress),
    trackFiles,
    trackMetadatas,
    userId: pendingAlbum.metadata.playlist_owner_id,
  }
  console.log(
    `Uploading ${pendingAlbum.metadata.playlist_name} by ${pendingAlbum.metadata.playlist_owner_id} to Audius...`
  )
  const result = await audiusSdk.albums.uploadAlbum(uploadAlbumRequest)
  console.log(result)
  return result
}

async function recordPendingReleaseErr(
  doc: PendingRelease,
  error: any,
  failedAfterUpload = false
) {
  let errorMsg = ''

  console.error(error)

  if (error instanceof Error) {
    errorMsg = error.message
  } else {
    errorMsg = 'An unknown error occurred'
  }

  try {
    await PendingReleases.updateOne(
      { _id: doc._id },
      {
        $push: { publish_errors: errorMsg },
        $inc: { failure_count: 1 },
        $set: { failed_after_upload: failedAfterUpload },
      }
    )
  } catch (updateError) {
    console.error(
      'Failed to update pending_releases doc with error:',
      updateError
    )
  }
}

export const publishReleases = async (
  audiusSdk: AudiusSdkType,
  s3: ReturnType<typeof createS3>
) => {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    let documents
    try {
      const currentDate = new Date()
      documents = await PendingReleases.find({
        publish_date: { $lte: currentDate },
      }).lean<PendingRelease[]>()
    } catch (error) {
      console.error('Failed to fetch pending releases:', error)
      await new Promise((resolve) => setTimeout(resolve, 10_000))
      continue
    }

    for (const doc of documents) {
      const releaseId = doc._id

      if (doc.failed_after_upload) {
        console.error(
          `pending_releases doc with ID ${releaseId} requires manual intervention because it's already uploaded to Audius but failed to move to published_releases.`
        )
        continue
      }

      let uploadResult: {
        trackId?: string | null
        albumId?: string | null
        blockHash: string
        blockNumber: number
      }
      try {
        if (doc.create_track_release?.ddex_release_ref) {
          uploadResult = await uploadTrack(
            audiusSdk,
            doc.create_track_release,
            s3
          )
        } else if (doc.create_album_release?.ddex_release_ref) {
          uploadResult = await uploadAlbum(
            audiusSdk,
            doc.create_album_release,
            s3
          )
        } else {
          recordPendingReleaseErr(
            doc,
            'Missing track or album in pending release'
          )
          continue
        }
      } catch (error) {
        recordPendingReleaseErr(doc, error)
        continue
      }

      const publishedData = {
        _id: releaseId,
        track: doc.create_track_release,
        album: doc.create_album_release,
        entity_id: doc.create_track_release
          ? uploadResult.trackId
          : uploadResult.albumId,
        blockhash: uploadResult.blockHash,
        blocknumber: uploadResult.blockNumber,
        publish_date: doc.publish_date,
        delivery_remote_path: doc.delivery_remote_path,
        created_at: new Date(),
      }
      console.log('Published release: ', JSON.stringify(publishedData))

      // Mark release as published in Mongo
      const session = await mongoose.startSession()
      try {
        session.startTransaction()
        const publishedRelease = new PublishedReleases(publishedData)
        await publishedRelease.save({ session })
        await PendingReleases.deleteOne({ _id: releaseId }).session(session)

        await session.commitTransaction()
      } catch (error) {
        await session.abortTransaction()
        recordPendingReleaseErr(doc, error, true)
      } finally {
        session.endSession()
      }
    }

    // Wait 10 seconds before checking for new releases
    await new Promise((resolve) => setTimeout(resolve, 10_000))
  }
}
