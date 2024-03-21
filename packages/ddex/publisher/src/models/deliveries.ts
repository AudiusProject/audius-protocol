import mongoose from 'mongoose'

const releaseSchema = new mongoose.Schema({
  release_id: String,
  xml_file_path: String,
  xml_content: Buffer,
  validation_errors: [String],
})

const batchSchema = new mongoose.Schema({
  batch_id: String,
  batch_xml_path: String,
  batch_xml_content: Buffer,
  validation_errors: [String],
  releases: [releaseSchema],
  ddex_schema: String,
  num_messages: Number,
})

// DDEX deliveries crawled from the S3 "raw" bucket
const deliveriesSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  zip_file_path: String,
  delivery_status: String,
  created_at: Date,
  releases: [releaseSchema],
  batches: [batchSchema],
  validation_errors: [String],
})

const Deliveries = mongoose.model('Deliveries', deliveriesSchema, 'deliveries')

export default Deliveries
