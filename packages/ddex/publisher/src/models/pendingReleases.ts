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
  'Dancehall',
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

interface ResourceContributor {
  name: string
  roles: [string]
  sequence_number: number
}
const resourceContributorSchema = new mongoose.Schema<ResourceContributor>({
  name: String,
  roles: [String],
  sequence_number: Number,
})

interface RightsController {
  name: string
  roles: [string]
  rights_share_unknown?: string
}

const rightsControllerSchema = new mongoose.Schema<RightsController>({
  name: String,
  roles: [String],
  rights_share_unknown: String,
})

interface Copyright {
  year: string
  text: string
}

const copyrightSchema = new mongoose.Schema<Copyright>({
  year: String,
  text: String,
})

const trackMetadataSchema = new mongoose.Schema({
  title: { type: String, required: true },
  release_date: { type: Date, required: true },
  ddex_release_ids: mongoose.Schema.Types.Mixed,
  genre: { type: String, enum: genres },
  duration: Number,
  preview_start_seconds: Number,
  isrc: String,
  license: String,
  description: String,
  mood: { type: String, enum: moods },
  tags: String,
  preview_audio_file_url: String,
  preview_audio_file_url_hash: String,
  preview_audio_file_url_hash_algo: String,
  audio_file_url: String,
  audio_file_url_hash: String,
  audio_file_url_hash_algo: String,

  // Required if it's a standalone track. Uses playlist_owner_id and playlist's cover_art_url if it's part of an album
  artist_id: String,
  artist_name: String,
  artists: { type: [resourceContributorSchema], default: null },
  resource_contributors: { type: [resourceContributorSchema], default: null },
  indirect_resource_contributors: {
    type: [resourceContributorSchema],
    default: null,
  },
  rights_controller: { type: rightsControllerSchema, default: null },
  copyright_line: { type: copyrightSchema, default: null },
  producer_copyright_line: { type: copyrightSchema, default: null },
  parental_warning_type: { type: String, default: null },
  cover_art_url: String,
  cover_art_url_hash: String,
  cover_art_url_hash_algo: String,
  is_stream_gated: { type: Boolean, default: false },
  stream_conditions: { type: mongoose.Schema.Types.Mixed, default: null },
  is_download_gated: { type: Boolean, default: false },
  download_conditions: { type: mongoose.Schema.Types.Mixed, default: null },
  is_stream_follow_gated: { type: Boolean, default: false },
  is_stream_tip_gated: { type: Boolean, default: false },
  is_download_follow_gated: { type: Boolean, default: false },
})

export type TrackMetadata = mongoose.InferSchemaType<typeof trackMetadataSchema>

const imageMetadataSchema = new mongoose.Schema({
  url: String,
  url_hash: String,
  url_hash_algo: String,
})

const nullableString = {
  type: String,
  default: null,
}

const nullableBool = {
  type: Boolean,
  default: null,
}

const nullableInt = {
  type: Number,
  default: null,
}

const releaseIDsSchema = new mongoose.Schema({
  party_id: { type: String, default: '' },
  catalog_number: { type: String, default: '' },
  icpn: { type: String, default: '' },
  grid: { type: String, default: '' },
  isan: { type: String, default: '' },
  isbn: { type: String, default: '' },
  ismn: { type: String, default: '' },
  isrc: { type: String, default: '' },
  issn: { type: String, default: '' },
  istc: { type: String, default: '' },
  iswc: { type: String, default: '' },
  mwli: { type: String, default: '' },
  sici: { type: String, default: '' },
  proprietary_id: { type: String, default: '' },
})

export const sdkUploadMetadataSchema = new mongoose.Schema(
  {
    // Used by both tracks and albums
    release_date: { type: Date, required: true },
    genre: { type: String, required: true, enum: genres },
    artists: { type: [resourceContributorSchema], default: null },
    description: nullableString,
    ddex_release_ids: releaseIDsSchema,
    mood: { type: String, enum: moods, default: null },
    tags: nullableString,
    copyright_line: copyrightSchema,
    producer_copyright_line: copyrightSchema,
    parental_warning_type: nullableString,
    license: nullableString,
    cover_art_url: { type: String, required: true },
    cover_art_url_hash: nullableString,
    cover_art_url_hash_algo: nullableString,
    has_deal: { type: Boolean, default: false },

    // Only for tracks
    title: nullableString,
    artist_id: nullableString,
    duration: Number,
    preview_start_seconds: nullableInt,
    isrc: nullableString,
    resource_contributors: [resourceContributorSchema],
    indirect_resource_contributors: [resourceContributorSchema],
    rights_controller: rightsControllerSchema,
    preview_audio_file_url: nullableString,
    preview_audio_file_url_hash: nullableString,
    preview_audio_file_url_hash_algo: nullableString,
    audio_file_url: nullableString,
    audio_file_url_hash: nullableString,
    audio_file_url_hash_algo: nullableString,
    is_stream_gated: { type: Boolean, default: false },
    stream_conditions: { type: mongoose.Schema.Types.Mixed, default: null },
    is_download_gated: { type: Boolean, default: false },
    download_conditions: { type: mongoose.Schema.Types.Mixed, default: null },
    is_stream_follow_gated: { type: Boolean, default: false },
    is_stream_tip_gated: { type: Boolean, default: false },
    is_download_follow_gated: { type: Boolean, default: false },

    // Only for albums
    tracks: [trackMetadataSchema],
    playlist_name: nullableString,
    playlist_owner_id: nullableString,
    playlist_owner_name: nullableString,
    is_album: nullableBool,
    is_private: nullableBool,
    upc: nullableString,
  },
  { _id: false }
) // _id is set to false because this schema is used as a sub-document

export type SDKUploadMetadataSchema = mongoose.InferSchemaType<
  typeof sdkUploadMetadataSchema
>

const releaseResourcesSchema = new mongoose.Schema({
  tracks: [trackMetadataSchema],
  images: [imageMetadataSchema],
})

const parsedReleaseElementSchema = new mongoose.Schema(
  {
    release_ref: { type: String, required: true },
    is_main_release: { type: Boolean, required: true },
    release_type: {
      type: String,
      required: true,
      enum: ['Album', 'EP', 'TrackRelease', 'Single'],
    },
    release_ids: releaseIDsSchema,
    release_date: { type: Date, required: true },
    validity_start_date: { type: Date, required: true },
    resources: releaseResourcesSchema,
    artist_id: { type: String, required: true },
    artist_name: { type: String, required: true },
    display_title: { type: String, required: true },
    display_subtitle: nullableString,
    reference_title: nullableString,
    reference_subtitle: nullableString,
    formal_title: nullableString,
    formal_subtitle: nullableString,
    genre: { type: String, enum: genres, required: true },
    duration: { type: Number, required: true },
    preview_start_seconds: nullableInt,
    isrc: nullableString,
    artists: { type: [resourceContributorSchema], default: null },
    resource_contributors: { type: [resourceContributorSchema], default: null },
    indirect_resource_contributors: {
      type: [resourceContributorSchema],
      default: null,
    },
    rights_controller: { type: rightsControllerSchema, default: null },
    copyright_line: { type: copyrightSchema, default: null },
    producer_copyright_line: { type: copyrightSchema, default: null },
    parental_warning_type: nullableString,
    is_stream_gated: { type: Boolean, default: false },
    stream_conditions: { type: mongoose.Schema.Types.Mixed, default: null },
    is_download_gated: { type: Boolean, default: false },
    download_conditions: { type: mongoose.Schema.Types.Mixed, default: null },
    is_stream_follow_gated: { type: Boolean, default: false },
    is_stream_tip_gated: { type: Boolean, default: false },
    is_download_follow_gated: { type: Boolean, default: false },
    has_deal: { type: Boolean, default: false },
  },
  { _id: false }
) // _id is set to false because this schema is used as a sub-document

export const releaseSchema = new mongoose.Schema({
  release_profile: {
    type: String,
    required: true,
    enum: [
      'CommonReleaseTypes/13/AudioSingle',
      'CommonReleaseTypesTypes/14/AudioAlbumMusicOnly',
      'Unspecified',
    ],
  },
  parsed_release_elems: [parsedReleaseElementSchema],
  sdk_upload_metadata: sdkUploadMetadataSchema,
})

const pendingReleasesSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  delivery_remote_path: { type: String, required: true },
  release: releaseSchema,
  created_at: { type: Date, required: true },
  publish_errors: [String],
  failure_count: { type: Number, default: 0 },
  failed_after_upload: { type: Boolean, default: false },
})

// Releases awaiting publishing. Releases are parsed from DDEX deliveries
const PendingReleases = mongoose.model(
  'PendingReleases',
  pendingReleasesSchema,
  'pending_releases'
)

export type PendingRelease = mongoose.HydratedDocument<
  mongoose.InferSchemaType<typeof pendingReleasesSchema>
>

export default PendingReleases
