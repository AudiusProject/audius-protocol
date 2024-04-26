import Releases, { releaseStatuses } from '../models/releases'
import type { Release } from '../models/releases'
import type {
  AudiusSdk as AudiusSdkType,
  UploadTrackRequest,
  UpdateTrackRequest,
  DeleteTrackRequest,
  UploadAlbumRequest,
  UpdateAlbumRequest,
  DeleteAlbumRequest,
  Genre,
  Mood,
} from '@audius/sdk'
import createS3 from './s3Service'

const formatTrackMetadata = (metadata: any): UploadTrackRequest['metadata'] => {
  return {
    title: metadata.title,
    description: metadata.description || '',
    genre: metadata.genre as Genre,
    ...(metadata.mood && { mood: metadata.mood as Mood }),
    tags: metadata.tags || '',
    isrc: metadata.isrc,
    iswc: metadata.ddex_release_ids?.iswc,
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
    // origFilename:
    // isOriginalAvailable:
    // remixOf:
  }
}

const formatAlbumMetadata = (metadata: any): UploadAlbumRequest['metadata'] => {
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
  pendingTrack: any,
  s3Service: ReturnType<typeof createS3>
) => {
  const userId = pendingTrack.artist_id
  const metadata = formatTrackMetadata(pendingTrack)

  const coverArtDownload = await s3Service.downloadFromS3Crawled(
    pendingTrack.cover_art_url
  )
  // TODO: We can hash and verify against the metadata here
  const coverArtFile = {
    buffer: coverArtDownload!,
    originalname: pendingTrack.cover_art_url.split('/').pop(),
  }
  const trackDownload = await s3Service.downloadFromS3Crawled(
    pendingTrack.audio_file_url
  )
  const trackFile = {
    buffer: trackDownload!,
    originalname: pendingTrack.audio_file_url.split('/').pop(),
  }

  const uploadTrackRequest: UploadTrackRequest = {
    userId,
    coverArtFile,
    metadata,
    onProgress: (progress: any) => console.log('Progress:', progress),
    trackFile,
  }
  console.log(
    `Uploading ${pendingTrack.title} by ${pendingTrack.artist_id} to Audius...`
  )
  const result = await audiusSdk.tracks.uploadTrack(uploadTrackRequest)
  console.log(result)
  return result
}

const updateTrack = async (
  audiusSdk: AudiusSdkType,
  trackId: string,
  pendingTrack: any,
  s3Service: ReturnType<typeof createS3>
) => {
  const userId = pendingTrack.artist_id
  const metadata = formatTrackMetadata(pendingTrack)

  const coverArtDownload = await s3Service.downloadFromS3Crawled(
    pendingTrack.cover_art_url
  )
  // TODO: We can hash and verify against the metadata here
  const coverArtFile = {
    buffer: coverArtDownload!,
    originalname: pendingTrack.cover_art_url.split('/').pop(),
  }

  const updateTrackRequest: UpdateTrackRequest = {
    trackId,
    userId,
    coverArtFile,
    metadata,
    onProgress: (progress: any) => console.log('Progress:', progress),
  }
  console.log(
    `Updating ${pendingTrack.title} by ${pendingTrack.artist_id} (track id ${trackId})...`
  )
  const result = await audiusSdk.tracks.updateTrack(updateTrackRequest)
  console.log(result)
  return result
}

const deleteTrack = async (
  audiusSdk: AudiusSdkType,
  trackId: string,
  trackMetadata: any
) => {
  const deleteTrackRequest: DeleteTrackRequest = {
    trackId,
    userId: trackMetadata.artist_id,
  }
  console.log(
    `Deleting ${trackMetadata.title} by ${trackMetadata.artist_id} (track id ${trackId})...`
  )
  const result = await audiusSdk.tracks.deleteTrack(deleteTrackRequest)
  console.log(result)
  return result
}

const uploadAlbum = async (
  audiusSdk: AudiusSdkType,
  pendingAlbum: any,
  s3Service: ReturnType<typeof createS3>
) => {
  // Fetch cover art from S3
  const coverArtDownload = await s3Service.downloadFromS3Crawled(
    pendingAlbum.cover_art_url
  )
  // TODO: We can hash and verify against the metadata here
  const coverArtFile = {
    buffer: coverArtDownload!,
    originalname: pendingAlbum.cover_art_url.split('/').pop(),
  }

  // Fetch track audio files from S3
  const trackFilesPromises = pendingAlbum.tracks.map(async (track: any) => {
    const trackDownload = await s3Service.downloadFromS3Crawled(
      track.audio_file_url!
    )
    // TODO: We can hash and verify against the metadata here
    return {
      buffer: trackDownload!,
      originalname: track.audio_file_url!.split('/').pop(),
    }
  })
  const trackFiles = await Promise.all(trackFilesPromises)

  const trackMetadatas = pendingAlbum.tracks.map((trackMetadata: any) =>
    formatTrackMetadata(trackMetadata)
  )

  const uploadAlbumRequest: UploadAlbumRequest = {
    coverArtFile,
    metadata: formatAlbumMetadata(pendingAlbum),
    onProgress: (progress: any) => console.log('Progress:', progress),
    trackFiles,
    trackMetadatas,
    userId: pendingAlbum.playlist_owner_id,
  }
  console.log(
    `Uploading ${pendingAlbum.playlist_name} by ${pendingAlbum.playlist_owner_id} to Audius...`
  )
  const result = await audiusSdk.albums.uploadAlbum(uploadAlbumRequest)
  console.log(result)
  return result
}

const updateAlbum = async (
  audiusSdk: AudiusSdkType,
  albumId: string,
  pendingAlbum: any,
  s3Service: ReturnType<typeof createS3>
) => {
  // Fetch cover art from S3
  const coverArtDownload = await s3Service.downloadFromS3Crawled(
    pendingAlbum.cover_art_url
  )
  // TODO: We can hash and verify against the metadata here
  const coverArtFile = {
    buffer: coverArtDownload!,
    originalname: pendingAlbum.cover_art_url.split('/').pop(),
  }

  // TODO we should add support for updating the album tracks' metadatas in the SDK as part of this update
  const updateAlbumRequest: UpdateAlbumRequest = {
    albumId,
    userId: pendingAlbum.playlist_owner_id,
    coverArtFile,
    metadata: formatAlbumMetadata(pendingAlbum),
    onProgress: (progress: any) => console.log('Progress:', progress),
  }
  console.log(
    `Updating ${pendingAlbum.playlist_name} by ${pendingAlbum.playlist_owner_id} (album id ${albumId})...`
  )
  const result = await audiusSdk.albums.updateAlbum(updateAlbumRequest)
  console.log(result)
  return result
}

const deleteAlbum = async (
  audiusSdk: AudiusSdkType,
  albumId: string,
  albumMetadata: any
) => {
  const deleteAlbumRequest: DeleteAlbumRequest = {
    albumId,
    userId: albumMetadata.playlist_owner_id,
  }
  console.log(
    `Deleting ${albumMetadata.playlist_name} by ${albumMetadata.playlist_owner_id} (album id ${albumId})...`
  )
  const result = await audiusSdk.albums.deleteAlbum(deleteAlbumRequest)
  console.log(result)
  return result
}

async function recordPendingReleaseErr(
  doc: Release,
  error: any,
  release_status: (typeof releaseStatuses)[number]
) {
  let errorMsg = ''

  console.error(error)

  if (error instanceof Error) {
    errorMsg = error.message
  } else {
    errorMsg = 'An unknown error occurred'
  }

  try {
    await Releases.updateOne(
      { _id: doc._id },
      {
        $push: { publish_errors: errorMsg },
        $inc: { failure_count: 1 },
        $set: { release_status },
      }
    )
  } catch (updateError) {
    console.error('Failed to update releases doc with error:', updateError)
  }
}

const publishReleases = async (
  audiusSdk: AudiusSdkType,
  s3: ReturnType<typeof createS3>
) => {
  let documents
  try {
    const currentDate = new Date()
    documents = await Releases.aggregate([
      {
        $match: {
          $and: [
            {
              $expr: {
                $lte: [
                  {
                    $max: [
                      '$sdk_upload_metadata.release_date',
                      '$sdk_upload_metadata.validity_start_date',
                    ],
                  },
                  currentDate,
                ],
              },
            },
            { release_status: 'awaiting_publish' },
          ],
        },
      },
    ])
  } catch (error) {
    console.error('Failed to fetch pending releases:', error)
    return
  }

  for (const doc of documents) {
    const releaseId = doc._id

    if (doc.release_status == 'failed_after_upload') {
      console.error(
        `releases doc with ID ${releaseId} requires manual intervention because it's already uploaded to Audius but failed to update in Mongo.`
      )
      continue
    } else if (doc.failure_count > 3) {
      console.error(
        `Tried to publish release with ID ${releaseId} 3 times. Requires manual intervention`
      )
      continue
    }

    let uploadResult:
      | {
          trackId?: string | null
          albumId?: string | null
          blockHash: string
          blockNumber: number
        }
      | undefined
    let updateResult:
      | {
          blockHash: string
          blockNumber: number
        }
      | undefined
    try {
      if (doc.is_update && !doc.entity_id) {
        throw new Error('Missing entity id in pending update release')
      }
      if (doc.sdk_upload_metadata?.title) {
        if (doc.is_update) {
          updateResult = await updateTrack(
            audiusSdk,
            doc.entity_id,
            doc.sdk_upload_metadata,
            s3
          )
        } else {
          uploadResult = await uploadTrack(
            audiusSdk,
            doc.sdk_upload_metadata,
            s3
          )
        }
      } else if (doc.sdk_upload_metadata?.playlist_name) {
        if (doc.is_update) {
          updateResult = await updateAlbum(
            audiusSdk,
            doc.entity_id,
            doc.sdk_upload_metadata,
            s3
          )
        } else {
          uploadResult = await uploadAlbum(
            audiusSdk,
            doc.sdk_upload_metadata,
            s3
          )
        }
      } else {
        throw new Error('Missing track or album in pending release')
      }
    } catch (error) {
      recordPendingReleaseErr(doc, error, 'failed_during_upload')
      continue
    }

    console.log('Published release:', releaseId)

    // Mark release as published in Mongo
    try {
      if (updateResult) {
        await Releases.updateOne(
          { _id: doc._id },
          {
            $set: {
              blockhash: updateResult.blockHash,
              blocknumber: updateResult.blockNumber,
              release_status: 'published',
            },
          }
        )
      } else if (uploadResult) {
        await Releases.updateOne(
          { _id: doc._id },
          {
            $set: {
              entity_id: doc.sdk_upload_metadata.title
                ? uploadResult.trackId
                : uploadResult.albumId,
              blockhash: uploadResult.blockHash,
              blocknumber: uploadResult.blockNumber,
              release_status: 'published',
            },
          }
        )
      }
    } catch (updateError) {
      console.error(
        'Failed to update release doc with published status:',
        updateError
      )
      recordPendingReleaseErr(doc, updateError, 'failed_after_upload')
    }
  }
}

const takedownReleases = async (audiusSdk: AudiusSdkType) => {
  let documents
  try {
    documents = await Releases.find({ release_status: 'awaiting_delete' })
  } catch (error) {
    console.error('Failed to fetch pending takedowns:', error)
    return
  }

  for (const doc of documents) {
    const releaseId = doc._id

    if (doc.release_status == 'failed_after_delete') {
      console.error(
        `releases doc with ID ${releaseId} requires manual intervention. Release was successfully removed from Audius but failed to update in Mongo.`
      )
      continue
    } else if (doc.failure_count > 3) {
      console.error(
        `Tried to takedown release with ID ${releaseId} 3 times. Requires manual intervention`
      )
      continue
    }

    let deleteResult: {
      blockHash: string
      blockNumber: number
    }
    try {
      if (!doc.entity_id) {
        throw new Error('Missing entity id in pending takedown release')
      }

      if (doc?.sdk_upload_metadata?.title) {
        deleteResult = await deleteTrack(
          audiusSdk,
          doc.entity_id,
          doc.sdk_upload_metadata
        )
      } else if (doc?.sdk_upload_metadata?.playlist_name) {
        deleteResult = await deleteAlbum(
          audiusSdk,
          doc.entity_id,
          doc.sdk_upload_metadata
        )
      } else {
        throw new Error('Missing track or album in pending takedown release')
      }
    } catch (error) {
      recordPendingReleaseErr(doc, error, 'failed_during_delete')
      continue
    }

    console.log('Took down release:', releaseId)

    // Mark release as deleted in Mongo
    try {
      await Releases.updateOne(
        { _id: doc._id },
        {
          $set: {
            blockhash: deleteResult.blockHash,
            blocknumber: deleteResult.blockNumber,
            release_status: 'deleted',
          },
        }
      )
    } catch (updateError) {
      console.error(
        'Failed to update release doc with deleted status:',
        updateError
      )
      recordPendingReleaseErr(doc, updateError, 'failed_after_delete')
    }
  }
}

export const processReleases = async (
  audiusSdk: AudiusSdkType,
  s3: ReturnType<typeof createS3>
) => {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    await publishReleases(audiusSdk, s3)
    await takedownReleases(audiusSdk)
    // Wait 10 seconds before checking for new pending releases/takedowns
    await new Promise((resolve) => setTimeout(resolve, 10_000))
  }
}
