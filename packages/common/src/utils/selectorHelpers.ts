import { isEqual } from 'lodash'
import { createSelectorCreator, defaultMemoize } from 'reselect'

const shallowCompare = <T>(a: T, b: T) =>
  a &&
  b &&
  Object.keys(a).length === Object.keys(b).length &&
  Object.keys(a).every(
    (key) => Object.prototype.hasOwnProperty.call(b, key) && a[key] === b[key]
  )

// A selector creator that memoizes based on a shallow object comparison.
export const createShallowSelector = createSelectorCreator(
  defaultMemoize,
  shallowCompare
)

export const createDeepEqualSelector = createSelectorCreator(
  defaultMemoize,
  isEqual
)
