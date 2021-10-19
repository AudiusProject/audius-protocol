// Stores references of CIDs mapped to local object URLs if they've already been
// fetched. CIDs are derived from the content they represent, so it is safe to do
// so without having to worry about invalidating the cache.

// Limit of the number of CIDs to store.
const MAX_SIZE = 2000

class ContentIdentifierCache {
  constructor() {
    // Acts as an LRU cache
    this.cache = new Map()
  }

  /**
   * Check if a CID is in the cache
   * @param {string} cid
   */
  has(cid) {
    return this.cache.has(cid)
  }

  /**
   * Retrieve the URL for an cid
   * @param {string} cid
   */
  get(cid) {
    return this.cache.get(cid)
  }

  /**
   * Adds an cid reference to a URL
   * @param {string} cid
   * @param {string} url a local url, e.g. one created by URL.createObjectURL().
   */
  add(cid, url) {
    this.cache.set(cid, url)
    if (this.cache.size > MAX_SIZE) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
  }
}

const CIDCache = new ContentIdentifierCache()
window.CIDCache = CIDCache
export default CIDCache
