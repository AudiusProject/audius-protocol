import Hashids from 'hashids/cjs'

/* We use a JS implementation of the the HashIds protocol (http://hashids.org)
 * to obfuscate our monotonically increasing int IDs as
 * strings in our consumable API.
 *
 * Discovery provider uses a python implementation of the same protocol
 * to encode and decode IDs.
 */
const HASH_SALT = 'azowernasdfoia'
const MIN_LENGTH = 5
const hashids = new Hashids(HASH_SALT, MIN_LENGTH)

/** Encodes an int ID into a string. */
export function encode(id: number): string {
  return hashids.encode([id])
}

/** Decodes a string id into an int. Returns null if an invalid ID. */
export function decode(id: string): number | null {
  const ids = hashids.decode(id)
  if (!ids.length) return null
  return ids[0] as number
}
