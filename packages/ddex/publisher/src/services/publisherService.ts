import mongoose from 'mongoose'
import Deliveries from '../models/deliveries'
import PendingReleases from '../models/pendingReleases'
import PublishedReleases from '../models/publishedReleases'
import type {
  TrackMetadata,
  CollectionMetadata,
  CreateTrackRelease,
  CreateAlbumRelease,
} from '../models/publishedReleases'
import type {
  AudiusSdk as AudiusSdkType,
  UploadTrackRequest,
  UploadAlbumRequest,
} from '@audius/sdk/dist/sdk/index.d.ts'

const getUserId = async (audiusSdk: AudiusSdkType, artistName: string) => {
  const { data: users } = await audiusSdk.users.searchUsers({
    query: artistName,
  })
  if (!users || users.length === 0) {
    throw new Error(`Could not find user ${artistName}`)
  }
  return users[0].id
}

const formatTrackMetadata = (metadata: TrackMetadata) => {
  return {
    ...metadata,
    releaseDate: new Date(metadata.release_date),
    isUnlisted: false,
    isPremium: false,
    fieldVisibility: {
      genre: true,
      mood: true,
      tags: true,
      share: true,
      play_count: true,
      remixes: true,
    },
  }
}

const formatAlbumMetadata = (metadata: CollectionMetadata) => {
  return {
    ...metadata,
    releaseDate: new Date(metadata.release_date),
  }
}

const uploadTrack = async (
  audiusSdk: AudiusSdkType,
  pendingTrack: CreateTrackRelease
) => {
  const userId = await getUserId(audiusSdk, pendingTrack.metadata.artist_name)
  const metadata = formatTrackMetadata(pendingTrack.metadata)

  const uploadTrackRequest: UploadTrackRequest = {
    userId,
    // TODO pull from s3
    coverArtFile: {},
    metadata,
    onProgress: (progress: any) => console.log('Progress:', progress),
    // TODO pull from s3
    trackFile: {},
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
  pendingAlbum: CreateAlbumRelease
) => {
  const trackMetadatas = pendingAlbum.tracks.map(
    (trackMetadata: TrackMetadata) => formatTrackMetadata(trackMetadata)
  )

  const uploadAlbumRequest: UploadAlbumRequest = {
    // TODO pull from s3
    coverArtFile: {},
    metadata: formatAlbumMetadata(pendingAlbum.metadata),
    onProgress: (progress: any) => console.log('Progress:', progress),
    // TODO pull from s3
    trackFiles: {},
    trackMetadatas,
    userId: pendingAlbum.playlist_owner_id,
  }
  console.log(
    `Uploading ${pendingAlbum.metadata.playlist_name} by ${pendingAlbum.metadata.playlist_owner_id} to Audius...`
  )
  const result = await audiusSdk.albums.uploadAlbum(uploadAlbumRequest)
  console.log(result)
  return result
}

export const publishReleases = async (audiusSdk: AudiusSdkType) => {
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
            doc.create_track_release
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
            doc.create_album_release
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
