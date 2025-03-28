import { QueryKey } from '@tanstack/react-query'

import { ID } from '~/models/Identifiers'
import { User } from '~/models/User'

import { DeveloperApp } from './developerApps'
import { TQTrack, TQCollection } from './models'
import { QUERY_KEYS } from './queryKeys'

// We're creating a registry of typed query keys and their associated data types
// This will allow us to have type-safe access to query data

// Define a type for all the query key strings from QUERY_KEYS
export type QueryKeyString = (typeof QUERY_KEYS)[keyof typeof QUERY_KEYS]

/**
 * TypedQueryKey represents all possible query key tuples
 * Each tuple includes the key string as the first element,
 * followed by any parameters needed for that query
 */
export type TypedQueryKey =
  | [typeof QUERY_KEYS.track, ID | null | undefined]
  | [typeof QUERY_KEYS.tracks, ID[] | null | undefined]
  | [typeof QUERY_KEYS.user, ID | null | undefined]
  | [typeof QUERY_KEYS.users, ID[] | null | undefined]
  | [typeof QUERY_KEYS.collection, ID | null | undefined]
  | [typeof QUERY_KEYS.collections, ID[] | null | undefined]
  | [typeof QUERY_KEYS.authorizedApps, ID | null | undefined]
  | [typeof QUERY_KEYS.developerApps, ID | null | undefined]
  | [typeof QUERY_KEYS.followers, { userId: ID; pageSize?: number }]
  | [typeof QUERY_KEYS.following, { userId: ID; pageSize?: number }]
  | QueryKey // Fallback for other query keys

/**
 * QueryKeyTypeMap maps each query key string to its corresponding data type
 * This is what associates each key with its expected data shape
 */
export interface QueryKeyTypeMap {
  [QUERY_KEYS.track]: TQTrack
  [QUERY_KEYS.tracks]: TQTrack[]
  [QUERY_KEYS.user]: User
  [QUERY_KEYS.users]: User[]
  [QUERY_KEYS.collection]: TQCollection
  [QUERY_KEYS.collections]: TQCollection[]
  [QUERY_KEYS.developerApps]: DeveloperApp[]
  [QUERY_KEYS.authorizedApps]: DeveloperApp[]
  // Add more mappings here based on your actual data types
}

/**
 * Utility type to extract the data type from a query key
 * Given a TypedQueryKey, this returns the corresponding data type
 */
export type QueryKeyData<K extends TypedQueryKey> =
  K[0] extends keyof QueryKeyTypeMap ? QueryKeyTypeMap[K[0]] : unknown
