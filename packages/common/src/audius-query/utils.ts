import { mapValues } from 'lodash'
import objectHash from 'object-hash'

import { Kind } from '~/models/Kind'
import { getCollections } from '~/store/cache/collections/selectors'
import { getTracks } from '~/store/cache/tracks/selectors'
import { getUsers } from '~/store/cache/users/selectors'
import { CommonState } from '~/store/reducers'

import { EntityMap } from './types'
export function capitalize(str: string) {
  return str.replace(str[0], str[0].toUpperCase())
}

export const getKeyFromFetchArgs = (fetchArgs: any) => {
  if (fetchArgs === undefined) return 'default'
  return objectHash(fetchArgs)
}

const entitySelectorMap = {
  [Kind.USERS]: getUsers,
  [Kind.TRACKS]: getTracks,
  [Kind.COLLECTIONS]: getCollections
}

export const selectCommonEntityMap = (
  state: CommonState,
  kind?: Kind,
  shallow?: boolean
): EntityMap | null => {
  if (kind && shallow) {
    return {
      [kind]: mapValues(entitySelectorMap[kind](state), 'metadata')
    }
  }

  const entityMap: EntityMap = {
    [Kind.USERS]: entitySelectorMap[Kind.USERS](state)
  }
  if (kind === Kind.USERS) return entityMap
  entityMap[Kind.TRACKS] = entitySelectorMap[Kind.TRACKS](state)
  if (kind === Kind.TRACKS) return entityMap
  entityMap[Kind.COLLECTIONS] = entitySelectorMap[Kind.COLLECTIONS](state)
  return entityMap
}
