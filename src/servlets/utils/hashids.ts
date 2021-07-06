import Hashids from 'hashids'

const HASH_SALT = 'azowernasdfoia'
const MIN_LENGTH = 5
const hashids = new Hashids(HASH_SALT, MIN_LENGTH)

/** Decodes a string id into an int. Returns null if an invalid ID. */
export const decodeHashId = (id: string): number | null => {
  try {
    const ids = hashids.decode(id)
    if (!ids.length) return null
    const num = Number(ids[0])
    if (isNaN(num)) return null
    return num
  } catch (e) {
    console.error(`Failed to decode ${id}`, e)
    return null
  }
}

export const encodeHashId = (id: number | null = null): string | null => {
  try {
    if (id === null) return null
    const encodedId = hashids.encode(id)
    return encodedId
  } catch (e) {
    console.error(`Failed to encode ${id}`, e)
    return null
  }
}
