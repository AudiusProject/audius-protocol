import Hashids from 'hashids'

import { Nullable } from './typeUtils'

const HASH_SALT = 'azowernasdfoia'
const MIN_LENGTH = 5
const hashids = new Hashids(HASH_SALT, MIN_LENGTH)

/** Decodes a string id into an int. Returns null if an invalid ID. */
export const decodeHashId = (id?: string): Nullable<number> => {
  if (!id) return null
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

export function encodeHashId(id: null): null
export function encodeHashId(id: number): string
export function encodeHashId(id: Nullable<number>): Nullable<string>
export function encodeHashId(id: Nullable<number>): Nullable<string> {
  try {
    if (id === null) return null
    const encodedId = hashids.encode(id)
    return encodedId
  } catch (e) {
    console.error(`Failed to encode ${id}`, e)
    return null
  }
}
