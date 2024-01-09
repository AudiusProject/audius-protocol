import { useState } from 'react'
import useReleases from 'providers/useReleases'

const Releases = () => {
  const [statusFilter, setStatusFilter] = useState('')
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined)
  const [prevCursor, setPrevCursor] = useState<string | undefined>(undefined)
  const { data, error, isPending } = useReleases(
    statusFilter,
    nextCursor,
    prevCursor
  )

  const handleNext = () => {
    if (data && data.length) {
      const lastItem = data[data.length - 1]
      setNextCursor(`${lastItem.release_date},${lastItem.id}`)
      setPrevCursor(undefined)
    }
  }

  const handlePrev = () => {
    if (data && data.length) {
      const firstItem = data[0]
      setPrevCursor(`${firstItem.release_date},${firstItem.id}`)
      setNextCursor(undefined)
    }
  }

  return (
    <>
      <h1>Releases</h1>
      <div>
        <button onClick={() => setStatusFilter('success')}>Success</button>
        <button onClick={() => setStatusFilter('processing')}>
          Processing
        </button>
        <button onClick={() => setStatusFilter('error')}>Error</button>
      </div>
      <div>
        <button onClick={handlePrev} disabled={!prevCursor}>
          Previous
        </button>
        <button
          onClick={handleNext}
          disabled={!nextCursor && (!data || data.length === 0)}
        >
          Next
        </button>
      </div>
      {isPending && <div>Loading...</div>}
      {error && <div>Error: {error.message}</div>}
      {data && (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Genre</th>
              <th>Release Date</th>
              <th>Artist Name</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((release) => (
              <tr key={release.id}>
                <td>{release.id}</td>
                <td>{release.data.title}</td>
                <td>{release.data.genre}</td>
                <td>{release.release_date.toLocaleString()}</td>
                <td>{release.data.artistName}</td>
                <td>{release.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  )
}

export default Releases
