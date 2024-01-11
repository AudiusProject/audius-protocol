import { useState } from 'react'

import { Text, Button, Box, Flex } from '@audius/harmony'

import useReleases from 'providers/useReleases'

import tableStyles from './Table.module.css'

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
                id='releasesPendingFilter'
                checked={statusFilter === 'pending'}
                onChange={() =>
                  setStatusFilter((curFilter) =>
                    curFilter === 'pending' ? '' : 'pending'
                  )
                }
              />
              <label htmlFor='releasesPendingFilter'>Pending</label>
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
          {isPending && <div>Loading...</div>}
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

          <Flex justifyContent='space-between'>
            <Button
              variant='tertiary'
              size='small'
              onClick={handlePrev}
              disabled={!prevCursor}
            >
              Previous
            </Button>
            <Button
              variant='tertiary'
              size='small'
              onClick={handleNext}
              disabled={!nextCursor && (!data || data.length === 0)}
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
