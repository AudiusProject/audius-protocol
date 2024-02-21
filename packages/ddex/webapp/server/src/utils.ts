import Hashids from 'hashids'

const HASH_SALT = 'azowernasdfoia'
const MIN_LENGTH = 5
const hashids = new Hashids(HASH_SALT, MIN_LENGTH)

// Decodes a hashed string id into an int. Returns null if an invalid ID
export const decodeHashedId = (id: string): number | null => {
  try {
    const ids = hashids.decode(id)
    if (!ids.length) return null
    const num = Number(ids[0])
    if (isNaN(num)) return null
    return num
  } catch (e) {
    return null
  }
}

export const isUserAdmin = (decodedUserId: number) => {
  const adminList = (process.env.DDEX_ADMIN_ALLOWLIST || '').split(',')
  return adminList.includes(`${decodedUserId}`)
}

export const isUserArtist = (decodedUserId: number) => {
  const artistList = (process.env.DDEX_ARTIST_ALLOWLIST || '').split(',')
  return artistList.includes(`${decodedUserId}`)
}
