import { useState } from 'react'

import { useTrack, useTracks } from '@audius/common/api'
import { cacheTracksSelectors } from '@audius/common/store'
import { Button } from '@audius/harmony'

import { useSelector } from 'utils/reducer'

const EXAMPLE_TRACK_ID = 1 // Replace with a real track ID from your system
const { getTrack } = cacheTracksSelectors

const ReactQueryToReduxCacheSyncPage = () => {
  const [showTracksQuery, setShowTracksQuery] = useState(false)

  // First load track using React Query
  const { data: trackFromReactQuery } = useTrack(EXAMPLE_TRACK_ID, {
    staleTime: 10000
  })

  // Get the same track from Redux store (should be populated from React Query)
  const trackFromRedux = useSelector((state) =>
    getTrack(state, { id: EXAMPLE_TRACK_ID })
  )

  // Load track using useTracks hook (will be populated from cache)
  const { data: tracksFromCache } = useTracks(
    showTracksQuery ? [EXAMPLE_TRACK_ID] : [],
    { staleTime: 10000 }
  )

  return (
    <div style={{ padding: 24 }}>
      <h1>React Query ➡️ Redux Cache Sync Example</h1>

      <div style={{ marginBottom: 40 }}>
        <p>
          This example demonstrates how data flows from React Query to Redux
          cache:
        </p>
        <ol>
          <li>First track is loaded using React Query directly</li>
          <li>Second track is shown from Redux (populated by React Query)</li>
          <li>
            Third track is loaded using useTracks hook after clicking the button
            - it should load instantly from cache!
          </li>
        </ol>
      </div>

      <div>
        <h3>Track from React Query:</h3>
        <pre>{JSON.stringify(trackFromReactQuery?.title, null, 2)}</pre>
      </div>

      <div>
        <h3>Same Track from Redux (populated by React Query):</h3>
        <pre>{JSON.stringify(trackFromRedux?.title, null, 2)}</pre>
      </div>

      <div style={{ marginBottom: 20 }}>
        <Button onClick={() => setShowTracksQuery(true)}>
          Load Track From Cache
        </Button>
      </div>

      {tracksFromCache?.[0] && (
        <div>
          <h3>Track from Cache (via useTracks):</h3>
          <pre>{JSON.stringify(tracksFromCache[0].title, null, 2)}</pre>
        </div>
      )}

      <div style={{ marginTop: 40, padding: 16, background: '#F7F7F7' }}>
        <h3>How it works:</h3>
        <ol>
          <li>
            When React Query loads the track, our hooks automatically sync it to
            Redux cache
          </li>
          <li>
            The Redux selector immediately shows the same data without a network
            request
          </li>
          <li>
            When we click the button to load via useTracks, it hits both caches
            first
          </li>
          <li>
            This means no additional network request is needed - the data is
            already there!
          </li>
        </ol>
      </div>
    </div>
  )
}

export default ReactQueryToReduxCacheSyncPage
