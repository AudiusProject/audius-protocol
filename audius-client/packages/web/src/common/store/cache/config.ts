// number above which entries get pruned from cache
export const CACHE_PRUNE_MIN =
  parseInt(process.env.REACT_APP_CACHE_PRUNE_MIN!, 10) || 250
