import { getAllEntries, getEntry } from '~/store/cache/selectors'
import type { CommonState } from '~/store/commonStore'

import { Kind } from '../../../models'
import type { ID, UID } from '../../../models'

import { BatchCachedUsers } from './types'

/** @deprecated use useUser instead */
export const getUser = (
  state: CommonState,
  props: { handle?: string | null; id?: ID | null; uid?: UID | null }
) => {
  if (props.handle && state.users.handles[props.handle.toLowerCase()]) {
    props.id = state.users.handles[props.handle.toLowerCase()]
  }
  return getEntry(state, {
    ...props,
    kind: Kind.USERS
  })
}

/** @deprecated use useUserByHandle instead */
export const getUserByHandle = (
  state: CommonState,
  props: { handle: string }
) => state.users.handles[props.handle] || null

/** @deprecated use useUsers instead */
export const getUsers = (
  state: CommonState,
  props?: {
    ids?: ID[] | null
    uids?: UID[] | null
    handles?: string[] | null
  }
): { [id: number]: BatchCachedUsers } => {
  if (props && props.ids) {
    const users: { [id: number]: BatchCachedUsers } = {}
    props.ids.forEach((id) => {
      const user = getUser(state, { id })
      if (user) {
        users[id] = { metadata: user }
      }
    })
    return users
  } else if (props && props.uids) {
    const users: { [id: number]: BatchCachedUsers } = {}
    props.uids.forEach((uid) => {
      const user = getUser(state, { uid })
      if (user) {
        users[user.user_id] = { metadata: user }
      }
    })
    return users
  } else if (props && props.handles) {
    const users: { [handle: string]: BatchCachedUsers } = {}
    props.handles.forEach((handle) => {
      const id = getUserByHandle(state, { handle: handle?.toLowerCase() })
      if (id) {
        const user = getUser(state, { id })
        if (user) users[handle] = { metadata: user }
      }
    })
    return users
  }
  return getAllEntries(state, { kind: Kind.USERS })
}
