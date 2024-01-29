import { useState } from 'react'

import { recordListen } from '../util/BedtimeClient'

export const useRecordListens = (
  position,
  listenId,
  /** the encoded track id (i.e. the hash id) */
  trackId,
  listenThresholdSec
) => {
  const [lastListenId, setLastListenId] = useState(null)

  if (position > listenThresholdSec && listenId !== lastListenId) {
    setLastListenId(listenId)
    if (trackId != null) {
      recordListen(trackId)
    }
  }
}
