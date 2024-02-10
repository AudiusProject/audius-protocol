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

interface Artist {
  name: string
  roles: string[]
}

const artistSchema = new mongoose.Schema({
  name: { type: String, required: true },
  roles: [{ type: String }],
})

export interface TrackMetadata {
  title: string
  release_date: string // Assuming ISO date format as string
  genre: string // This could be further refined to a union of the specific genre strings
  duration: number
  preview_start_seconds?: number
  isrc?: string
  license?: string
  description?: string
  mood?: string // This could be further refined to a union of the specific mood strings
  tags?: string
  artists: Artist[]
  artist_name: string
  copyright: string
  preview_audio_file_url: string
  audio_file_url: string
  cover_art_url: string
}

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
  audio_file_url: { type: String, required: true },
  cover_art_url: { type: String, required: true },
})

export interface CollectionMetadata {
  playlist_name: string
  playlist_owner_id: string
  description?: string
  is_album: boolean
  is_private: boolean
  tags?: string
  genre: string // Again, could be a specific union type
  mood: string // Specific union type for moods
  release_date: string
  license?: string
  upc?: string
  cover_art_url: string
}

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
})

export interface CreateTrackRelease {
  ddex_release_ref: string
  metadata: TrackMetadata
}

const createTrackReleaseSchema = new mongoose.Schema({
  ddex_release_ref: { type: String, required: true },
  metadata: { type: trackMetadataSchema, required: true },
})

export interface CreateAlbumRelease {
  ddex_release_ref: string
  tracks: TrackMetadata[]
  metadata: CollectionMetadata
}

const createAlbumReleaseSchema = new mongoose.Schema({
  ddex_release_ref: { type: String, required: true },
  tracks: [trackMetadataSchema],
  metadata: { type: collectionMetadataSchema, required: true },
})

const pendingReleasesSchema = new mongoose.Schema({
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
