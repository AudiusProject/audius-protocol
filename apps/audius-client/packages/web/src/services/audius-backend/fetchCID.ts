import { CID, ID, Nullable, getErrorMessage, CIDCache } from '@audius/common'

import { waitForLibsInit } from './eagerLoadUtils'

export const fetchCID = async (
  cid: CID,
  creatorNodeGateways = [] as string[],
  cache = true,
  asUrl = true,
  trackId: Nullable<ID> = null
) => {
  await waitForLibsInit()
  try {
    const res = await window.audiusLibs.File.fetchCID(
      cid,
      creatorNodeGateways,
      () => {},
      // If requesting a url (we mean a blob url for the file),
      // otherwise, default to JSON
      asUrl ? 'blob' : 'json',
      trackId
    )
    if (asUrl) {
      const url = URL.createObjectURL(res.data)
      if (cache) CIDCache.add(cid, url)
      return url
    }
    return res?.data ?? null
  } catch (e) {
    const message = getErrorMessage(e)
    if (message === 'Unauthorized') {
      return message
    }
    console.error(e)
    return asUrl ? '' : null
  }
}
