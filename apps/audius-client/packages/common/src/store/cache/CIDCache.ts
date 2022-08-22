// Stores references of CIDs mapped to local object URLs if they've already been
// fetched. CIDs are derived from the content they represent, so it is safe to do
// so without having to worry about invalidating the cache.

// Limit of the number of CIDs to store.
const MAX_SIZE = 2000

class ContentIdentifierCache {
  cache: Map<string, string>
  constructor() {
    // Acts as an LRU cache
    this.cache = new Map()
  }

  /**
   * Check if a CID is in the cache
   */
  has(cid: string) {
    return this.cache.has(cid)
  }

  /**
   * Retrieve the URL for an cid
   */
  get(cid: string) {
    return this.cache.get(cid)
  }

  /**
   * Adds an cid reference to a URL
   */
  add(cid: string, url: string) {
    this.cache.set(cid, url)
    if (this.cache.size > MAX_SIZE) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
  }
}

export const CIDCache = new ContentIdentifierCache()
