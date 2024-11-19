type ValueOrArray<T> = undefined | string | number | T | Array<ValueOrArray<T>>
type SortObject = ValueOrArray<Record<string, string | number>>

/**
 * Recursively sorts object keys alphabetically
 */
export function sortObjectKeys(x: SortObject): SortObject {
  if (typeof x !== 'object' || !x) {
    return x
  }
  if (Array.isArray(x)) {
    return x.map(sortObjectKeys)
  }
  return Object.keys(x)
    .sort()
    .reduce((o, k) => ({ ...o, [k]: sortObjectKeys(x[k]) }), {})
}
