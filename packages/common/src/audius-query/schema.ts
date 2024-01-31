import { schema } from 'normalizr'

import { Kind } from '~/models/Kind'

export type SchemaKey = 'user' | 'users' | 'track' | 'tracks'

export const userSchema = new schema.Entity(
  Kind.USERS,
  {},
  { idAttribute: 'user_id' }
)

export const trackSchema = new schema.Entity(
  Kind.TRACKS,
  { user: userSchema },
  { idAttribute: 'track_id' }
)

export const collectionSchema = new schema.Entity(
  Kind.COLLECTIONS,
  { user: userSchema, tracks: new schema.Array(trackSchema) },
  { idAttribute: 'playlist_id' }
)

export const apiResponseSchema = new schema.Object({
  user: userSchema,
  track: trackSchema,
  collection: collectionSchema,
  users: new schema.Array(userSchema),
  tracks: new schema.Array(trackSchema),
  collections: new schema.Array(collectionSchema)
})
