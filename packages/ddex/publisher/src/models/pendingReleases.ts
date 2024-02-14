import mongoose from 'mongoose'

const genres = [
  'All Genres',
  'Electronic',
  'Rock',
  'Metal',
  'Alternative',
  'Hip-Hop/Rap',
  'Experimental',
  'Punk',
  'Folk',
  'Pop',
  'Ambient',
  'Soundtrack',
  'World',
  'Jazz',
  'Acoustic',
  'Funk',
  'R&B/Soul',
  'Devotional',
  'Classical',
  'Reggae',
  'Podcasts',
  'Country',
  'Spoken Word',
  'Comedy',
  'Blues',
  'Kids',
  'Audiobooks',
  'Latin',
  'Lo-Fi',
  'Hyperpop',
  'Techno',
  'Trap',
  'House',
  'Tech House',
  'Deep House',
  'Disco',
  'Electro',
  'Jungle',
  'Progressive House',
  'Hardstyle',
  'Glitch Hop',
  'Trance',
  'Future Bass',
  'Future House',
  'Tropical House',
  'Downtempo',
  'Drum & Bass',
  'Dubstep',
  'Jersey Club',
  'Vaporwave',
  'Moombahton',
]
const moods = [
  'Peaceful',
  'Romantic',
  'Sentimental',
  'Tender',
  'Easygoing',
  'Yearning',
  'Sophisticated',
  'Sensual',
  'Cool',
  'Gritty',
  'Melancholy',
  'Serious',
  'Brooding',
  'Fiery',
  'Defiant',
  'Aggressive',
  'Rowdy',
  'Excited',
  'Energizing',
  'Empowering',
  'Stirring',
  'Upbeat',
  'Other',
]

const artistSchema = new mongoose.Schema({
  name: { type: String, required: true },
  roles: [{ type: String }],
})

const trackMetadataSchema = new mongoose.Schema({
  title: { type: String, required: true },
  release_date: { type: String, required: true }, // Assuming ISO date format as string
  genre: { type: String, enum: genres, required: true },
  duration: { type: Number, required: true },
  preview_start_seconds: { type: Number },
  isrc: { type: String },
  license: { type: String },
  description: { type: String },
  mood: { type: String, enum: moods },
  tags: { type: String },
  artists: [artistSchema],
  artist_name: { type: String, required: true },
  copyright: { type: String, required: true },
  preview_audio_file_url: { type: String, required: true },
  preview_audio_file_url_hash: { type: String, required: true },
  preview_audio_file_url_hash_algo: { type: String, required: true },
  audio_file_url: { type: String, required: true },
  audio_file_url_hash: { type: String, required: true },
  audio_file_url_hash_algo: { type: String, required: true },
  cover_art_url: { type: String, required: true },
  cover_art_url_hash: { type: String, required: true },
  cover_art_url_hash_algo: { type: String, required: true },
})

export type TrackMetadata = mongoose.InferSchemaType<typeof trackMetadataSchema>

const collectionMetadataSchema = new mongoose.Schema({
  playlist_name: { type: String, required: true },
  playlist_owner_id: { type: String, required: true },
  description: { type: String },
  is_album: { type: Boolean, required: true },
  is_private: { type: Boolean, required: true },
  tags: { type: String },
  genre: { type: String, enum: genres, required: true },
  mood: { type: String, enum: moods, required: true },
  release_date: { type: String, required: true }, // Assuming ISO date format as string
  license: { type: String },
  upc: { type: String },
  cover_art_url: { type: String, required: true },
  cover_art_url_hash: { type: String, required: true },
  cover_art_url_hash_algo: { type: String, required: true },
})

export type CollectionMetadata = mongoose.InferSchemaType<
  typeof collectionMetadataSchema
>

export const createTrackReleaseSchema = new mongoose.Schema({
  ddex_release_ref: { type: String, required: true },
  metadata: { type: trackMetadataSchema, required: true },
})

export type CreateTrackRelease = mongoose.InferSchemaType<
  typeof createTrackReleaseSchema
>

export const createAlbumReleaseSchema = new mongoose.Schema({
  ddex_release_ref: { type: String, required: true },
  tracks: [trackMetadataSchema],
  metadata: { type: collectionMetadataSchema, required: true },
})

export type CreateAlbumRelease = mongoose.InferSchemaType<
  typeof createAlbumReleaseSchema
>

export const pendingReleasesSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, required: true },
  upload_etag: { type: String, required: true },
  delivery_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  publish_date: { type: Date, required: true },
  created_at: { type: Date, required: true },
  create_track_release: { type: createTrackReleaseSchema, required: true },
  create_album_release: { type: createAlbumReleaseSchema, required: true },
})

// Releases parsed from indexed DDEX deliveries that are awaiting publishing
const PendingReleases = mongoose.model(
  'PendingReleases',
  pendingReleasesSchema,
  'pending_releases'
)

export default PendingReleases
