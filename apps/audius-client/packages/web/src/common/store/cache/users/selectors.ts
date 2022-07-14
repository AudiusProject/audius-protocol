import { ID, UID } from '@audius/common'

import Kind from 'common/models/Kind'
import Status from 'common/models/Status'
import { User } from 'common/models/User'
import { CommonState } from 'common/store'
import {
  getEntry,
  getAllEntries,
  getEntryTimestamp
} from 'common/store/cache/selectors'

import { getCollection } from '../collections/selectors'
import { getTrack } from '../tracks/selectors'

export const getUser = (
  state: CommonState,
  props: { handle?: string | null; id?: ID | null; uid?: UID | null }
) => {
  if (props.handle && state.users.handles[props.handle.toLowerCase()]) {
    props.id = state.users.handles[props.handle.toLowerCase()].id
  }
  return getEntry(state, {
    ...props,
    kind: Kind.USERS
  })
}
export const getUserByHandle = (
  state: CommonState,
  props: { handle: string }
) => state.users.handles[props.handle] || null

export const getStatus = (state: CommonState, props: { id: ID }) =>
  state.users.statuses[props.id] || null

export const getUsers = (
  state: CommonState,
  props?: {
    ids?: ID[] | null
    uids?: UID[] | null
    handles?: string[] | null
  }
) => {
  if (props && props.ids) {
    const users: { [id: number]: User } = {}
    props.ids.forEach((id) => {
      const user = getUser(state, { id })
      if (user) {
        users[id] = user
      }
    })
    return users
  } else if (props && props.uids) {
    const users: { [id: number]: User } = {}
    props.uids.forEach((uid) => {
      const user = getUser(state, { uid })
      if (user) {
        users[user.user_id] = user
      }
    })
    return users
  } else if (props && props.handles) {
    const users: { [handle: string]: User } = {}
    props.handles.forEach((handle) => {
      const { id } =
        getUserByHandle(state, { handle: handle.toLowerCase() }) || {}
      if (id) {
        const user = getUser(state, { id })
        if (user) users[handle] = user
      }
    })
    return users
  }
  return getAllEntries(state, { kind: Kind.USERS })
}

/**
 * Selects from the cache and strips away cache-only fields.
 * @param {CommonState} state
 * @param {object} props { kind, ids }
 */
export const getUserTimestamps = (
  state: CommonState,
  {
    ids,
    handles
  }: {
    ids?: ID[] | null
    handles?: string[] | null
  }
) => {
  if (ids) {
    const entryTimestamps = ids.reduce((acc, id) => {
      acc[id] = getEntryTimestamp(state, { kind: Kind.USERS, id })
      return acc
    }, {} as { [id: number]: number | null })
    return entryTimestamps
  } else if (handles) {
    return handles.reduce((acc, handle) => {
      const { id } =
        getUserByHandle(state, { handle: handle.toLowerCase() }) || {}
      if (!id) return acc
      const timestamp = getEntryTimestamp(state, { kind: Kind.USERS, id })
      if (timestamp) acc[handle] = timestamp
      return acc
    }, {} as { [handle: string]: number })
  }
  return {}
}

export const getStatuses = (state: CommonState, props: { ids: ID[] }) => {
  const statuses: { [id: number]: Status } = {}
  props.ids.forEach((id) => {
    const status = getStatus(state, { id })
    if (status) {
      statuses[id] = status
    }
  })
  return statuses
}

export const getUserFromTrack = (
  state: CommonState,
  props: { id?: ID | null; uid?: UID | null }
) => {
  const track = getTrack(state, props)
  if (track && track.owner_id) return getUser(state, { id: track.owner_id })
  return null
}

export const getUserFromCollection = (
  state: CommonState,
  props: { id?: ID | null; uid?: UID | null }
) => {
  const collection = getCollection(state, props)
  if (collection && collection.playlist_owner_id)
    return getUser(state, { id: collection.playlist_owner_id })
  return null
}
