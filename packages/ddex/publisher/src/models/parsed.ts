import mongoose from 'mongoose'

// Releases that parsed from indexed DDEX deliveries, awaiting publishing
const parsedSchema = new mongoose.Schema({
  id: mongoose.Schema.Types.ObjectId,
  upload_etag: String,
  delivery_id: String,
  entity: String,
  publish_date: Date,
  created_at: Date,
})

const Parsed = mongoose.model('Parsed', parsedSchema, 'parsed')

export default Parsed
