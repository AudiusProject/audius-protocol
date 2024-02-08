import mongoose from 'mongoose'

// DDEX releases that have been published
const publishedReleasesSchema = new mongoose.Schema({
  id: mongoose.Schema.Types.ObjectId,
  upload_etag: String,
  delivery_id: mongoose.Schema.Types.ObjectId,
  entity: String,
  publish_date: Date,
  entity_id: String,
  created_at: Date,
})

const PublishedReleases = mongoose.model(
  'PublishedReleases',
  publishedReleasesSchema,
  'published_releases'
)

export default PublishedReleases
