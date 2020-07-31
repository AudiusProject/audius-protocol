const Hashids = require('hashids/cjs')

const HASH_SALT = "azowernasdfoia"
const hashids = new Hashids(HASH_SALT, 5)

/** Encodes an int ID into a string. */
function encode(id) {
  hashids.encode(id)
}

/** Decodes a string id into an int. Returns null if an invalid ID. */
function decode(id) {
  const ids = hashids.decode(id)
  if (!ids.length) return null
  return ids[0]
}

module.exports.encode = encode
module.exports.decode = decode
