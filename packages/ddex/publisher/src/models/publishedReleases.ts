import mongoose from 'mongoose'
import {
  createTrackReleaseSchema,
  createAlbumReleaseSchema,
} from './pendingReleases'

// DDEX releases that have been published
const publishedReleasesSchema = new mongoose.Schema({
  upload_etag: String,
  delivery_id: mongoose.Schema.Types.ObjectId,
  publish_date: Date,
  entity_id: String,
  blockhash: String,
  blocknumber: Number,
  track: createTrackReleaseSchema,
  album: createAlbumReleaseSchema,
  created_at: Date,
})

const PublishedReleases = mongoose.model(
  'PublishedReleases',
  publishedReleasesSchema,
  'published_releases'
)

export type PublishedRelease = mongoose.InferSchemaType<
  typeof publishedReleasesSchema
>

export default PublishedReleases
