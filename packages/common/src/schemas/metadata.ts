// TODO(nkang) - convert to TS
// @ts-nocheck

import { pick } from 'lodash'

const trackMetadataSchema = {
  track_cid: null,
  owner_id: null,
  title: null,
  duration: null,
  length: null,
  cover_art: null,
  cover_art_sizes: null,
  tags: null,
  genre: null,
  mood: null,
  credits_splits: null,
  created_at: null,
  // TODO: CREATE DATE IS REQUIRED, BUT THIS FIELD IS NEVER USED.
  create_date: null,
  updated_at: null,
  release_date: null,
  file_type: null,
  track_segments: [],
  has_current_user_reposted: false,
  followee_reposts: null,
  followee_saves: null,
  is_current: true,
  is_scheduled_release: false,
  is_unlisted: false,
  is_stream_gated: false,
  stream_conditions: null,
  is_download_gated: false,
  download_conditions: null,
  is_original_available: false,
  is_downloadable: false,
  preview_start_seconds: null,
  audio_upload_id: null,
  field_visibility: {
    genre: true,
    mood: true,
    tags: true,
    share: false,
    play_count: false,
    remixes: true
  },
  remix_of: null,
  repost_count: 0,
  save_count: 0,
  description: null,
  license: null,
  isrc: null,
  iswc: null,
  additional_ids: null,
  download: null,
  is_playlist_upload: false,
  ai_attribution_user_id: null,
  ddex_app: null
}

export const newTrackMetadata = (fields, validate = false): TrackMetadata => {
  const validFields = validate
    ? pick(fields, Object.keys(trackMetadataSchema).concat(['track_id']))
    : fields
  const remixParentTrackId = fields?.remix_of?.tracks?.[0]?.parent_track_id
  return {
    ...trackMetadataSchema,
    track_segments: [...trackMetadataSchema.track_segments],
    followee_reposts: [...(trackMetadataSchema.followee_reposts || [])],
    followee_saves: [...(trackMetadataSchema.followee_saves || [])],
    ...validFields,
    // Reformat remixes last so we don't carry through any extra metadata that
    // was part of the remix_of response from backends
    remix_of: remixParentTrackId
      ? createRemixOfMetadata({ parentTrackId: remixParentTrackId })
      : null
  }
}

const collectionMetadataSchema = {
  is_album: false,
  is_current: true,
  is_private: true,
  tags: null,
  genre: null,
  mood: null,
  created_at: null,
  updated_at: null,
  cover_art: null,
  cover_art_sizes: null,
  playlist_name: '',
  playlist_owner_id: null,
  save_count: null,
  license: null,
  upc: null,
  description: null,
  ddex_app: null
}

export const newCollectionMetadata = (fields?: any, validate = false) => {
  const validFields = validate
    ? pick(
        fields,
        Object.keys(collectionMetadataSchema).concat(['playlist_id'])
      )
    : fields
  return {
    ...collectionMetadataSchema,
    ...validFields
  }
}

const userMetadataSchema = {
  allow_ai_attribution: false,
  wallet: '',
  name: null,
  handle: '',
  profile_picture: null,
  profile_picture_sizes: null,
  cover_photo_sizes: null,
  cover_photo: null,
  bio: null,
  location: null,
  is_verified: false,
  creator_node_endpoint: null,
  updated_at: null,
  associated_wallets: null,
  associated_sol_wallets: null,
  collectibles: null,
  playlist_library: null,
  events: null,
  is_deactivated: false,
  artist_pick_track_id: null
}

export const newUserMetadata = (fields?: any, validate = false): User => {
  const validFields = validate
    ? pick(fields, Object.keys(userMetadataSchema).concat(['user_id']))
    : fields
  return {
    ...userMetadataSchema,
    ...validFields
  }
}

export const createRemixOfMetadata = ({
  parentTrackId
}: {
  parentTrackId: number
}) => {
  return {
    tracks: [
      {
        parent_track_id: parentTrackId
      }
    ]
  }
}
