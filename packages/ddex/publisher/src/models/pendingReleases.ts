import mongoose from 'mongoose'

// Releases parsed from indexed DDEX deliveries that are awaiting publishing
const pendingReleasesSchema = new mongoose.Schema({
  id: mongoose.Schema.Types.ObjectId,
  upload_etag: String,
  delivery_id: mongoose.Schema.Types.ObjectId,
  entity: String,
  publish_date: Date,
  created_at: Date,
})

const PendingReleases = mongoose.model('PendingReleases', pendingReleasesSchema, 'pending_releases')

export default PendingReleases
