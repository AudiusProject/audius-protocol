import { InfiniteData, QueryKey } from '@tanstack/react-query'

import { Favorite } from '~/models'
import { ID } from '~/models/Identifiers'
import { TrendingIds } from '~/models/Trending'
import { User } from '~/models/User'

import { CommentOrReply, TrackCommentCount } from '../comments/types'
import { DeveloperApp } from '../developerApps'
import { TQTrack, TQCollection } from '../models'
import { QUERY_KEYS } from '../queryKeys'

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
  | [typeof QUERY_KEYS.followers, ID | null | undefined, { pageSize?: number }]
  | [typeof QUERY_KEYS.following, ID | null | undefined, { pageSize?: number }]
  | [typeof QUERY_KEYS.comment, ID]
  | [typeof QUERY_KEYS.commentReplies, ID]
  | [typeof QUERY_KEYS.trackCommentList, ID]
  | [typeof QUERY_KEYS.trackCommentCount, ID]
  | [typeof QUERY_KEYS.remixes, ID]
  | [typeof QUERY_KEYS.profileTracks, ID]
  | [typeof QUERY_KEYS.profileReposts, ID]
  | [typeof QUERY_KEYS.accountUser, ID]
  | [typeof QUERY_KEYS.favoritedTracks, ID]
  | [typeof QUERY_KEYS.libraryTracks, ID]
  | [typeof QUERY_KEYS.libraryCollections, ID]
  | [typeof QUERY_KEYS.feed, ID]
  | [typeof QUERY_KEYS.userByHandle, string | null | undefined]
  | [typeof QUERY_KEYS.trackByPermalink, string | null | undefined]
  | [typeof QUERY_KEYS.collectionByPermalink, string | null | undefined]
  | [typeof QUERY_KEYS.trendingIds, { genre?: string }]
  | [typeof QUERY_KEYS.notificationUnreadCount, ID | null | undefined]
  | [typeof QUERY_KEYS.relatedArtists, ID]
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
  [QUERY_KEYS.followers]: ID[]
  [QUERY_KEYS.following]: ID[]
  [QUERY_KEYS.trending]: TQTrack[]
  [QUERY_KEYS.trendingPlaylists]: TQCollection[]
  [QUERY_KEYS.trendingUnderground]: TQTrack[]
  [QUERY_KEYS.trendingIds]: TrendingIds
  [QUERY_KEYS.notifications]: InfiniteData<Notification[]>
  [QUERY_KEYS.notificationUnreadCount]: number
  [QUERY_KEYS.favorites]: ID[] // user_ids
  [QUERY_KEYS.favoritedTracks]: Favorite[]
  [QUERY_KEYS.libraryTracks]: TQTrack[]
  [QUERY_KEYS.libraryCollections]: TQCollection[]
  [QUERY_KEYS.feed]: (TQTrack | TQCollection)[]
  [QUERY_KEYS.userByHandle]: ID
  [QUERY_KEYS.trackByPermalink]: ID
  [QUERY_KEYS.collectionByPermalink]: ID
  [QUERY_KEYS.commentReplies]: CommentOrReply[]
  [QUERY_KEYS.trackCommentList]: InfiniteData<ID[]> | null // Track comments
  [QUERY_KEYS.trackCommentCount]: TrackCommentCount
  [QUERY_KEYS.remixes]: TQTrack[]
  [QUERY_KEYS.profileTracks]: TQTrack[]
  [QUERY_KEYS.profileReposts]: (TQTrack | TQCollection)[]
  [QUERY_KEYS.relatedArtists]: InfiniteData<User[]>
  // Add more mappings here based on your actual data types
}

/**
 * Utility type to extract the data type from a query key
 * Given a TypedQueryKey, this returns the corresponding data type
 */
export type QueryKeyData<
  TData = unknown,
  K extends TypedQueryKey = TypedQueryKey
> =
  | (K[0] extends keyof QueryKeyTypeMap ? QueryKeyTypeMap[K[0]] : TData)
  | undefined
