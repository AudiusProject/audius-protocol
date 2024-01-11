import { useState } from 'react'
import useReleases from 'providers/useReleases'
import { Button, ButtonType, ButtonSize, Box, Flex } from '@audius/harmony'

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
    <Box>
      <Flex direction="column" gap="s">
        <h1>Releases</h1>
        <Flex justifyContent="space-between" alignItems="center">
          <input
            type="checkbox"
            id="successFilter"
            checked={statusFilter === 'success'}
            onChange={() =>
              setStatusFilter((curFilter) =>
                curFilter === 'success' ? '' : 'success'
              )
            }
          />
          <label htmlFor="successFilter">Success</label>
          <input
            type="checkbox"
            id="pendingFilter"
            checked={statusFilter === 'pending'}
            onChange={() =>
              setStatusFilter((curFilter) =>
                curFilter === 'pending' ? '' : 'pending'
              )
            }
          />
          <label htmlFor="pendingFilter">Pending</label>
          <input
            type="checkbox"
            id="errorFilter"
            checked={statusFilter === 'error'}
            onChange={() =>
              setStatusFilter((curFilter) =>
                curFilter === 'error' ? '' : 'error'
              )
            }
          />
          <label htmlFor="errorFilter">Error</label>
        </Flex>
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

        <Flex justifyContent="space-between">
          <Button
            variant={ButtonType.TERTIARY}
            size={ButtonSize.SMALL}
            onClick={handlePrev}
            disabled={!prevCursor}
          >
            Previous
          </Button>
          <Button
            variant={ButtonType.TERTIARY}
            size={ButtonSize.SMALL}
            onClick={handleNext}
            disabled={!nextCursor && (!data || data.length === 0)}
          >
            Next
          </Button>
        </Flex>
      </Flex>
    </Box>
  )
}

export default Releases
