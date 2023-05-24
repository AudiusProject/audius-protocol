import { mapValues, zipObject } from 'lodash'

import { Kind } from 'models/Kind'
import { CommonState } from 'store/reducers'

import * as cacheSelectors from '../store/cache/selectors'

import { EntityMap, StrippedEntityMap } from './types'

export function capitalize(str: string) {
  return str.replace(str[0], str[0].toUpperCase())
}

export const getKeyFromFetchArgs = (fetchArgs: any) => {
  return JSON.stringify(fetchArgs)
}

export const stripEntityMap = (entities: EntityMap): StrippedEntityMap => {
  return mapValues(
    entities,
    (entityType) => entityType && Object.keys(entityType)
  )
}

export const selectRehydrateEntityMap = (
  state: CommonState,
  strippedEntityMap: StrippedEntityMap
): EntityMap | null => {
  try {
    return mapValues(
      strippedEntityMap,
      (entityIds, kind) =>
        entityIds &&
        zipObject(
          entityIds,
          entityIds.map((entityId) => {
            const cachedEntity = cacheSelectors.getEntry(state, {
              kind: Kind[kind as keyof typeof Kind],
              id: parseInt(entityId)
            })
            // Reject and return null if not all entities are populated
            if (!cachedEntity) throw new Error('missing entity')
            return cachedEntity
          })
        )
    )
  } catch (e) {
    if ((e as Error).message !== 'missing entity') {
      throw e
    }
    return null
  }
}
