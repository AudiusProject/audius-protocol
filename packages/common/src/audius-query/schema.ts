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

export const managedUserSchema = new schema.Object({
  user: userSchema
})

export const accountUserSchema = new schema.Object({
  user: userSchema
})

export const userManagerSchema = new schema.Object({
  manager: userSchema
})

export const schemas = {
  accountUser: accountUserSchema,
  managedUsers: new schema.Array(managedUserSchema),
  user: userSchema,
  userManagers: new schema.Array(userManagerSchema),
  track: trackSchema,
  collection: collectionSchema,
  users: new schema.Array(userSchema),
  tracks: new schema.Array(trackSchema),
  collections: new schema.Array(collectionSchema),
  albums: new schema.Array(collectionSchema),
  playlists: new schema.Array(collectionSchema)
}

export const apiResponseSchema = new schema.Object(schemas)
