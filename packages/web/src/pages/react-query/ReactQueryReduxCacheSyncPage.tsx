import { useEffect, useState } from 'react'

import { useTrack, useTracks } from '@audius/common/api'
import { cacheTracksSelectors, trackPageActions } from '@audius/common/store'
import { Button } from '@audius/harmony'
import { useDispatch } from 'react-redux'

import { useSelector } from 'utils/reducer'

const EXAMPLE_TRACK_ID = 1 // Replace with a real track ID from your system
const { getTrack } = cacheTracksSelectors

const ReactQueryReduxCacheSyncPage = () => {
  const dispatch = useDispatch()
  const [showTracksQuery, setShowTracksQuery] = useState(false)

  // Load track using Redux
  useEffect(() => {
    dispatch(trackPageActions.fetchTrack(EXAMPLE_TRACK_ID, '', '', false))
  }, [dispatch])

  const trackFromRedux = useSelector((state) =>
    getTrack(state, { id: EXAMPLE_TRACK_ID })
  )

  // Load track using React Query
  const { data: trackFromReactQuery } = useTrack(EXAMPLE_TRACK_ID, {
    staleTime: 10000,
    enabled: showTracksQuery
  })

  // Load track using useTracks hook (will be populated from cache)
  const { data: tracksFromCache } = useTracks(
    showTracksQuery ? [EXAMPLE_TRACK_ID] : [],
    { staleTime: 10000 }
  )

  return (
    <div style={{ padding: 24 }}>
      <h1>Redux ↔️ React Query Cache Sync Example</h1>

      <div style={{ marginBottom: 40 }}>
        <p>
          This example demonstrates how data flows between Redux and React Query
          caches:
        </p>
        <ol>
          <li>First track is loaded using Redux (like in TrackPage)</li>
          <li>Second track is loaded using React Query directly</li>
          <li>
            Third track is loaded using useTracks hook after clicking the button
            - it should load instantly from cache!
          </li>
        </ol>
      </div>

      <div>
        <h3>Track from Redux:</h3>
        <pre>{trackFromRedux?.title}</pre>
      </div>

      <div style={{ marginBottom: 20 }}>
        <Button onClick={() => setShowTracksQuery(true)}>
          Load Track From Cache{' '}
        </Button>
      </div>

      {trackFromReactQuery && (
        <div>
          <h3>Track from React Query:</h3>
          <pre>{trackFromReactQuery.title}</pre>
        </div>
      )}

      {tracksFromCache?.[0] && (
        <div>
          <h3>Track from Cache (via useTracks):</h3>
          <pre>{tracksFromCache[0].title}</pre>
        </div>
      )}

      <div style={{ marginTop: 40, padding: 16, background: '#F7F7F7' }}>
        <h3>How it works:</h3>
        <ol>
          <li>
            When Redux loads the track, our saga middleware syncs it to React
            Query cache
          </li>
          <li>
            When React Query loads the track directly, it&apos;s stored in its
            own cache
          </li>
          <li>
            When we click the button to load via useTracks, it hits the React
            Query cache first
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

export default ReactQueryReduxCacheSyncPage
