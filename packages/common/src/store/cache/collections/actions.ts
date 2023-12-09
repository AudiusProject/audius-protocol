import { ID, UID, SquareSizes, Collection } from '../../../models'

import { EditPlaylistValues } from './types'

export const CREATE_PLAYLIST = 'CREATE_PLAYLIST'
export const CREATE_PLAYLIST_REQUESTED = 'CREATE_PLAYLIST_REQUESTED'
export const CREATE_PLAYLIST_SUCCEEDED = 'CREATE_PLAYLIST_SUCCEEDED'
export const CREATE_PLAYLIST_FAILED = 'CREATE_PLAYLIST_FAILED'

export const EDIT_PLAYLIST = 'EDIT_PLAYLIST'
export const EDIT_PLAYLIST_SUCCEEDED = 'EDIT_PLAYLIST_SUCCEEDED'
export const EDIT_PLAYLIST_FAILED = 'EDIT_PLAYLIST_FAILED'

export const ADD_TRACK_TO_PLAYLIST = 'ADD_TRACK_TO_PLAYLIST'
export const ADD_TRACK_TO_PLAYLIST_FAILED = 'ADD_TRACK_TO_PLAYLIST_FAILED'

export const REMOVE_TRACK_FROM_PLAYLIST = 'REMOVE_TRACK_FROM_PLAYLIST'
export const REMOVE_TRACK_FROM_PLAYLIST_FAILED =
  'REMOVE_TRACK_FROM_PLAYLIST_FAILED'

export const ORDER_PLAYLIST = 'ORDER_PLAYLIST'
export const ORDER_PLAYLIST_FAILED = 'ORDER_PLAYLIST_FAILED'

export const PUBLISH_PLAYLIST = 'PUBLISH_PLAYLIST'
export const PUBLISH_PLAYLIST_FAILED = 'PUBLISH_PLAYLIST_FAILED'
export const DELETE_PLAYLIST = 'DELETE_PLAYLIST'
export const DELETE_PLAYLIST_REQUESTED = 'DELETE_PLAYLIST_REQUESTED'
export const DELETE_PLAYLIST_SUCCEEDED = 'DELETE_PLAYLIST_SUCCEEDED'
export const DELETE_PLAYLIST_FAILED = 'DELETE_PLAYLIST_FAILED'

export const SET_PERMALINK = 'CACHE/COLLECTION/SET_PERMALINK'

export const FETCH_COVER_ART = 'TRACKS/FETCH_COVER_ART'

/**
 * @param initTrackId optional track id to pull artwork from.
 */
export function createAlbum(
  formFields: Partial<Collection>,
  source: string,
  initTrackId?: number | null,
  noticeType: 'route' | 'toast' = 'route'
) {
  return {
    type: CREATE_PLAYLIST,
    formFields,
    source,
    initTrackId,
    noticeType,
    isAlbum: true
  }
}

/**
 * @param initTrackId optional track id to pull artwork from.
 */
export function createPlaylist(
  formFields: Partial<Collection>,
  source: string,
  initTrackId?: number | null,
  noticeType: 'route' | 'toast' = 'route'
) {
  return {
    type: CREATE_PLAYLIST,
    formFields,
    source,
    initTrackId,
    noticeType,
    isAlbum: false
  }
}

export function createPlaylistRequested(
  playlistId: ID,
  noticeType: 'route' | 'toast'
) {
  return { type: CREATE_PLAYLIST_REQUESTED, playlistId, noticeType }
}

export function createPlaylistSucceeded() {
  return { type: CREATE_PLAYLIST_SUCCEEDED }
}

export function createPlaylistFailed(
  error: Error,
  params: Record<string, unknown>,
  metadata: Record<string, unknown>
) {
  return { type: CREATE_PLAYLIST_FAILED, error, params, metadata }
}

export function editPlaylist(
  playlistId: number,
  formFields: EditPlaylistValues
) {
  return { type: EDIT_PLAYLIST, playlistId, formFields }
}

export function editPlaylistSucceeded() {
  return { type: EDIT_PLAYLIST_SUCCEEDED }
}

export function editPlaylistFailed(
  error: Error,
  params: Record<string, unknown>,
  metadata: Record<string, unknown>
) {
  return { type: EDIT_PLAYLIST_FAILED, error, params, metadata }
}

export function addTrackToPlaylist(trackId: ID, playlistId: ID) {
  return { type: ADD_TRACK_TO_PLAYLIST, trackId, playlistId }
}

export function addTrackToPlaylistFailed(
  error: Error,
  params: Record<string, unknown>,
  metadata: Record<string, unknown>
) {
  return { type: ADD_TRACK_TO_PLAYLIST_FAILED, error, params, metadata }
}

export function removeTrackFromPlaylist(
  trackId: number,
  playlistId: number,
  timestamp: number
) {
  return { type: REMOVE_TRACK_FROM_PLAYLIST, trackId, playlistId, timestamp }
}

export function removeTrackFromPlaylistFailed(
  error: Error,
  params: Record<string, unknown>,
  metadata: Record<string, unknown>
) {
  return { type: REMOVE_TRACK_FROM_PLAYLIST_FAILED, error, params, metadata }
}

export function orderPlaylist(
  playlistId: number,
  trackIdsAndTimes: { id: ID; time: number }[],
  trackUids?: UID[]
) {
  return { type: ORDER_PLAYLIST, playlistId, trackIdsAndTimes, trackUids }
}

export function orderPlaylistFailed(
  error: Error,
  params: Record<string, unknown>,
  metadata: Record<string, unknown>
) {
  return { type: ORDER_PLAYLIST_FAILED, error, params, metadata }
}

export function publishPlaylist(playlistId: ID, dismissToastKey?: string) {
  return { type: PUBLISH_PLAYLIST, playlistId, dismissToastKey }
}

export function publishPlaylistFailed(
  error: Error,
  params: Record<string, unknown>,
  metadata: Record<string, unknown>
) {
  return { type: PUBLISH_PLAYLIST_FAILED, error, params, metadata }
}

export function deletePlaylist(playlistId: ID) {
  return { type: DELETE_PLAYLIST, playlistId }
}

export function deletePlaylistRequested() {
  return { type: DELETE_PLAYLIST_REQUESTED }
}

export function deletePlaylistSucceeded() {
  return { type: DELETE_PLAYLIST_SUCCEEDED }
}

export function deletePlaylistFailed(
  error: Error,
  params: Record<string, unknown>,
  metadata: Record<string, unknown>
) {
  return { type: DELETE_PLAYLIST_FAILED, error, params, metadata }
}

export function setPermalink(permalink: string, collectionId: ID) {
  return { type: SET_PERMALINK, permalink, collectionId }
}

export function fetchCoverArt(collectionId: ID, size: SquareSizes) {
  return { type: FETCH_COVER_ART, collectionId, size }
}
