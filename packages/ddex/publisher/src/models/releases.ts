import mongoose from 'mongoose'

export const releaseStatuses = [
  'awaiting_parse',
  'awaiting_publish',
  'error_user_match',
  'error_genre_match',
  'error_parsing',
  'failed_during_upload',
  'failed_after_upload',
  'published',
  'awaiting_delete',
  'deleted',
  'failed_during_delete',
  'failed_after_delete',
] as const

const releasesSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  delivery_remote_path: { type: String, required: true },
  release_profile: {
    type: String,
    required: true,
    enum: [
      'CommonReleaseTypes/13/AudioSingle',
      'CommonReleaseTypesTypes/14/AudioAlbumMusicOnly',
      'Unspecified',
    ],
  },
  parsed_release_elems: mongoose.Schema.Types.Mixed,
  sdk_upload_metadata: mongoose.Schema.Types.Mixed,
  last_parsed: { type: Date, required: true },
  parse_errors: [String],
  publish_errors: [String],
  failure_count: { type: Number, default: 0 },
  release_status: {
    type: String,
    enum: releaseStatuses,
  },
  is_update: { type: Boolean, default: false },

  // Only set if the release was successfully published
  entity_id: String,
  blockhash: String,
  blocknumber: Number,
})

// Releases awaiting publishing. Releases are parsed from DDEX deliveries
const Releases = mongoose.model('Releases', releasesSchema, 'releases')

export type Release = mongoose.HydratedDocument<
  mongoose.InferSchemaType<typeof releasesSchema>
>

export default Releases
