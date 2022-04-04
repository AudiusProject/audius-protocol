const Hashids = require('hashids/cjs')

class HashIds {
  constructor () {
    this.HASH_SALT = 'azowernasdfoia'
    this.MIN_LENGTH = 5
    this.hashids = new Hashids(this.HASH_SALT, this.MIN_LENGTH)
  }

  encode (id) {
    return this.hashids.encode([id])
  }

  decode (id) {
    const ids = this.hashids.decode(id)
    if (!ids.length) return null
    return ids[0]
  }
}

module.exports = HashIds
