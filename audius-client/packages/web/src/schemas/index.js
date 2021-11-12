import { pick } from 'lodash'

import { createRemixOfMetadata } from 'containers/upload-page/store/utils/remixes'

const trackMetadataSchema = {
  owner_id: null,
  title: null,
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
  is_unlisted: false,
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
  download: null
}

export const newTrackMetadata = (fields, validate = false) => {
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
  description: null
}

export const newCollectionMetadata = (fields, validate = false) => {
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
  wallet: '',
  is_creator: false,
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
  is_deactivated: false
}

export const newUserMetadata = (fields, validate = false) => {
  const validFields = validate
    ? pick(fields, Object.keys(userMetadataSchema).concat(['user_id']))
    : fields
  return {
    ...userMetadataSchema,
    ...validFields
  }
}
