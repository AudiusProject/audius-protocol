import mongoose from 'mongoose'

// Releases that parsed from indexed DDEX deliveries, awaiting publishing
const parsedSchema = new mongoose.Schema({
  delivery_id: String,
  entity: String,
  publish_date: Date,
})

const Parsed = mongoose.model('Parsed', parsedSchema, 'parsed')

export default Parsed
