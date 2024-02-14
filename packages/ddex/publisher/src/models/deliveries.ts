import mongoose from 'mongoose'

// DDEX deliveries indexed from DDEX uploads
const deliveriesSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  upload_etag: String,
  delivery_status: String,
  xml_file_path: String,
  xml_content: Buffer,
  created_at: Date,
})

const Deliveries = mongoose.model('Deliveries', deliveriesSchema, 'deliveries')

export default Deliveries
