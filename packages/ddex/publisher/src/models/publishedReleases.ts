import mongoose from 'mongoose'
import {
  createTrackReleaseSchema,
  createAlbumReleaseSchema,
} from './pendingReleases'

// DDEX releases that have been published
const publishedReleasesSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  delivery_etag: { type: String, required: true },
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
