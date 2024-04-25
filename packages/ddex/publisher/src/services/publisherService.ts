import Releases, { releaseStatuses } from '../models/releases'
import type {
  TrackMetadata,
  SDKUploadMetadataSchema,
  Release,
} from '../models/releases'
import type {
  AudiusSdk as AudiusSdkType,
  UploadTrackRequest,
  UploadAlbumRequest,
  Genre,
  Mood,
} from '@audius/sdk'
import createS3 from './s3Service'

const formatTrackMetadata = (
  metadata: SDKUploadMetadataSchema | TrackMetadata
): UploadTrackRequest['metadata'] => {
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

const formatAlbumMetadata = (
  metadata: SDKUploadMetadataSchema
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
  pendingTrack: SDKUploadMetadataSchema,
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

const uploadAlbum = async (
  audiusSdk: AudiusSdkType,
  pendingAlbum: SDKUploadMetadataSchema,
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
  const trackFilesPromises = pendingAlbum.tracks.map(async (track) => {
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

  const trackMetadatas = pendingAlbum.tracks.map(
    (trackMetadata: TrackMetadata) => formatTrackMetadata(trackMetadata)
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

export const publishReleases = async (
  audiusSdk: AudiusSdkType,
  s3: ReturnType<typeof createS3>
) => {
  // eslint-disable-next-line no-constant-condition
  while (true) {
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
      await new Promise((resolve) => setTimeout(resolve, 10_000))
      continue
    }

    for (const doc of documents) {
      const releaseId = doc._id

      if (doc.failed_after_upload) {
        console.error(
          `releases doc with ID ${releaseId} requires manual intervention because it's already uploaded to Audius but failed to update in Mongo.`
        )
        continue
      } else if (doc.failure_count > 3) {
        console.error(
          `pending_releases doc with ID ${releaseId} requires manual intervention because we've already retried it 3 times.`
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
        if (doc?.sdk_upload_metadata?.title) {
          uploadResult = await uploadTrack(
            audiusSdk,
            doc.sdk_upload_metadata,
            s3
          )
        } else if (doc?.sdk_upload_metadata?.playlist_name) {
          uploadResult = await uploadAlbum(
            audiusSdk,
            doc.sdk_upload_metadata,
            s3
          )
        } else {
          recordPendingReleaseErr(
            doc,
            'Missing track or album in pending release',
            'failed_during_upload'
          )
          continue
        }
      } catch (error) {
        recordPendingReleaseErr(doc, error, 'failed_during_upload')
        continue
      }

      console.log('Published release:', releaseId)

      // Mark release as published in Mongo
      try {
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
      } catch (updateError) {
        console.error(
          'Failed to update release doc with published status:',
          updateError
        )
        recordPendingReleaseErr(doc, updateError, 'failed_after_upload')
      }
    }

    // Wait 10 seconds before checking for new pending releases
    await new Promise((resolve) => setTimeout(resolve, 10_000))
  }
}
