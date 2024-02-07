import mongoose from 'mongoose'

// DDEX deliveries indexed from DDEX uploads
const indexedSchema = new mongoose.Schema({
  id: mongoose.Schema.Types.ObjectId,
  upload_etag: String,
  delivery_id: String,
  delivery_status: String,
  xml_file_path: String,
  xml_content: Buffer,
})

const Indexed = mongoose.model('Indexed', indexedSchema, 'Indexed')

export default Indexed
