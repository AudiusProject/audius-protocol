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
  roles: [String],
})

const trackMetadataSchema = new mongoose.Schema({
  title: { type: String, required: true },
  release_date: { type: Date, required: true },
  genre: { type: String, enum: genres, required: true },
  duration: { type: Number, required: true },
  preview_start_seconds: Number,
  isrc: String,
  license: String,
  description: String,
  mood: { type: String, enum: moods },
  tags: String,
  artists: [artistSchema],
  copyright: String,
  preview_audio_file_url: String,
  preview_audio_file_url_hash: String,
  preview_audio_file_url_hash_algo: String,
  audio_file_url: { type: String, required: true },
  audio_file_url_hash: { type: String, required: true },
  audio_file_url_hash_algo: { type: String, required: true },

  // Required if it's a standalone track. Uses playlist_owner_id and playlist's cover_art_url if it's part of an album
  artist_name: String,
  cover_art_url: String,
  cover_art_url_hash: String,
  cover_art_url_hash_algo: String,
})

export type TrackMetadata = mongoose.InferSchemaType<typeof trackMetadataSchema>

const collectionMetadataSchema = new mongoose.Schema({
  playlist_name: { type: String, required: true },
  playlist_owner_id: { type: String, required: true },
  genre: { type: String, enum: genres, required: true },
  release_date: { type: Date, required: true },
  description: String,
  is_album: Boolean,
  is_private: Boolean,
  tags: String,
  mood: { type: String, enum: moods },
  license: String,
  upc: String,
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
  upload_etag: { type: String, required: true },
  delivery_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  publish_date: { type: Date, required: true },
  created_at: { type: Date, required: true },
  create_track_release: createTrackReleaseSchema,
  create_album_release: createAlbumReleaseSchema,
  upload_errors: [String],
  failure_count: Number,
  failed_after_upload: Boolean,
})

// Releases parsed from indexed DDEX deliveries that are awaiting publishing
const PendingReleases = mongoose.model(
  'PendingReleases',
  pendingReleasesSchema,
  'pending_releases'
)

export type PendingRelease = mongoose.HydratedDocument<
  mongoose.InferSchemaType<typeof pendingReleasesSchema>
>

export default PendingReleases
