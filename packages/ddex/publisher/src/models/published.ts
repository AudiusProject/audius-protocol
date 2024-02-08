import mongoose from 'mongoose'

// DDEX releases that have been published
const publishedSchema = new mongoose.Schema({
  id: mongoose.Schema.Types.ObjectId,
  upload_etag: String,
  delivery_id: String,
  entity: String,
  publish_date: Date,
  entity_id: String,
  created_at: Date,
})

const Published = mongoose.model('Published', publishedSchema, 'published')

export default Published
