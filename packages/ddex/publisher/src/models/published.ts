import mongoose from 'mongoose'

// DDEX releases that have been published
const publishedSchema = new mongoose.Schema({
  delivery_id: String,
  entity: String,
  publish_date: Date,
  track_id: String,
})

const Published = mongoose.model('Published', publishedSchema, 'published')

export default Published
