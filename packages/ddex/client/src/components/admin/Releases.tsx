import { useState } from 'react'

import { Text, Button, Box, Flex } from '@audius/harmony'

import { trpc } from 'utils/trpc'

import tableStyles from './Table.module.css'

const Releases = () => {
  const [statusFilter, setStatusFilter] = useState<
    '' | 'error' | 'success' | 'processing' | undefined
  >('')
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined)
  const [prevCursor, setPrevCursor] = useState<string | undefined>(undefined)
  const { data, error, isLoading } = trpc.release.getReleases.useQuery({
    status: statusFilter,
    nextCursor,
    prevCursor
  })

  const handleNext = () => {
    if (data?.hasMoreNext) {
      const maxRelease = data.releases[0]
      setNextCursor(`${maxRelease.release_date},${maxRelease.id}`)
      setPrevCursor(undefined)
    }
  }

  const handlePrev = () => {
    if (data?.hasMorePrev) {
      const minRelease = data.releases[data.releases.length - 1]
      setPrevCursor(`${minRelease.release_date},${minRelease.id}`)
      setNextCursor(undefined)
    }
  }

  return (
    <Box borderRadius='s' shadow='near' p='xl' backgroundColor='white'>
      <Flex direction='column' gap='l'>
        <Text variant='heading' color='heading'>
          Releases
        </Text>
        <Text variant='body' color='default'>
          <Flex alignItems='center' gap='m'>
            <div>
              <input
                type='checkbox'
                id='releasesSuccessFilter'
                checked={statusFilter === 'success'}
                onChange={() =>
                  setStatusFilter((curFilter) =>
                    curFilter === 'success' ? '' : 'success'
                  )
                }
              />
              <label htmlFor='releasesSuccessFilter'>Success</label>
            </div>
            <div>
              <input
                type='checkbox'
                id='releasesProcessingFilter'
                checked={statusFilter === 'processing'}
                onChange={() =>
                  setStatusFilter((curFilter) =>
                    curFilter === 'processing' ? '' : 'processing'
                  )
                }
              />
              <label htmlFor='releasesProcessingFilter'>Processing</label>
            </div>
            <div>
              <input
                type='checkbox'
                id='releasesErrorFilter'
                checked={statusFilter === 'error'}
                onChange={() =>
                  setStatusFilter((curFilter) =>
                    curFilter === 'error' ? '' : 'error'
                  )
                }
              />
              <label htmlFor='releasesErrorFilter'>Error</label>
            </div>
          </Flex>
          {isLoading && <div>Loading...</div>}
          {error && <div>Error: {error.message}</div>}
          {data && (
            <table className={tableStyles.styledTable}>
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
                {data.releases.map((release) => (
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

          <Flex justifyContent='space-between'>
            <Button
              variant='tertiary'
              size='small'
              onClick={handlePrev}
              disabled={!data?.hasMorePrev}
            >
              Previous
            </Button>
            <Button
              variant='tertiary'
              size='small'
              onClick={handleNext}
              disabled={!data?.hasMoreNext}
            >
              Next
            </Button>
          </Flex>
        </Text>
      </Flex>
    </Box>
  )
}

export default Releases
