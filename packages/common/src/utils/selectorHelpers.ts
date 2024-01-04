import { isEqual } from 'lodash'
import { createSelectorCreator, lruMemoize } from 'reselect'

export const shallowCompare = <T>(a: T, b: T) =>
  a &&
  b &&
  Object.keys(a).length === Object.keys(b).length &&
  Object.keys(a).every(
    (key) => Object.prototype.hasOwnProperty.call(b, key) && a[key] === b[key]
  )

export const areSetsEqual = <T>(a: Set<T>, b: Set<T>) =>
  a.size === b.size && [...a].every((value) => b.has(value))

// A selector creator that memoizes based on a shallow object comparison.
export const createShallowSelector = createSelectorCreator(
  lruMemoize,
  shallowCompare
)

export const createDeepEqualSelector = createSelectorCreator(
  lruMemoize,
  isEqual
)
