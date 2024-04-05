import mongoose from 'mongoose'
import { releaseSchema } from './pendingReleases'

// DDEX releases that have been published
const publishedReleasesSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  delivery_remote_path: { type: String, required: true },
  entity_id: String,
  blockhash: String,
  blocknumber: Number,
  release: releaseSchema,
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
