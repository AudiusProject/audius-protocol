export const FETCH_ACCOUNT_COLLECTIONS = 'SAVED_COLLECTIONS/FETCH_COLLECTIONS'

type FetchAccountCollectionsAction = {
  type: typeof FETCH_ACCOUNT_COLLECTIONS
}

export function fetchAccountCollections(): FetchAccountCollectionsAction {
  return { type: FETCH_ACCOUNT_COLLECTIONS }
}
