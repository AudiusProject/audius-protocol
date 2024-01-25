import { useState } from 'react'

import { Text, Button, Box, Flex } from '@audius/harmony'

import { trpc } from 'utils/trpc'

import styles from './Collection.module.css'

type CollectionT = 'uploads' | 'indexed' | 'parsed' | 'published'

const TableHeader = ({ collection }: { collection: CollectionT }) => {
  switch (collection) {
    case 'uploads':
      return (
        <thead>
          <tr>
            <th>ID</th>
            <th>Uploaded By</th>
            <th>Uploaded At</th>
            <th>Status</th>
          </tr>
        </thead>
      )
    case 'indexed':
      return (
        <thead>
          <tr>
            <th>Upload ID</th>
            <th>TODO</th>
            <th>TODO</th>
            <th>TODO</th>
          </tr>
        </thead>
      )
    case 'parsed':
      return (
        <thead>
          <tr>
            <th>Upload ID</th>
            <th>TODO</th>
            <th>TODO</th>
            <th>TODO</th>
          </tr>
        </thead>
      )
    case 'published':
      return (
        <thead>
          <tr>
            <th>Upload ID</th>
            <th>TODO</th>
            <th>TODO</th>
            <th>TODO</th>
          </tr>
        </thead>
      )
  }
}

const TableData = ({
  collection,
  data
}: {
  collection: CollectionT
  data: any
}) => {
  switch (collection) {
    case 'uploads':
      return (
        <tbody>
          {data.items.map((item) => (
            <tr key={item.id}>
              <td>TODO</td>
              <td>TODO</td>
              <td>TODO</td>
              <td>TODO</td>
            </tr>
          ))}
        </tbody>
      )
    case 'indexed':
      return (
        <tbody>
          {data.items.map((item) => (
            <tr key={item.id}>
              <td>TODO</td>
              <td>TODO</td>
              <td>TODO</td>
              <td>TODO</td>
            </tr>
          ))}
        </tbody>
      )
    case 'parsed':
      return (
        <tbody>
          {data.items.map((item) => (
            <tr key={item.id}>
              <td>TODO</td>
              <td>TODO</td>
              <td>TODO</td>
              <td>TODO</td>
            </tr>
          ))}
        </tbody>
      )
    case 'published':
      return (
        <tbody>
          {data.items.map((item) => (
            <tr key={item.id}>
              <td>TODO</td>
              <td>TODO</td>
              <td>TODO</td>
              <td>TODO</td>
            </tr>
          ))}
        </tbody>
      )
  }
}

export const Collection = ({ collection }: { collection: CollectionT }) => {
  const [nextId, setNextId] = useState<number | undefined>(undefined)
  const [prevId, setPrevId] = useState<number | undefined>(undefined)
  let query
  switch (collection) {
    case 'uploads':
      query = trpc.uploads
      break
    case 'indexed':
      query = trpc.indexed
      break
    case 'parsed':
      query = trpc.parsed
      break
    case 'published':
      query = trpc.published
      break
  }
  const { data, error, isLoading } = query.listCollection.useQuery({
    nextId,
    prevId
  })

  const handleNext = () => {
    if (data?.hasMoreNext) {
      setNextId(data.items[0].id)
      setPrevId(undefined)
    }
  }

  const handlePrev = () => {
    if (data?.hasMorePrev) {
      setPrevId(data.items[data.items.length - 1].id)
      setNextId(undefined)
    }
  }

  return (
    <Box borderRadius='s' shadow='near' p='xl' backgroundColor='white'>
      <Flex direction='column' gap='l'>
        <Text variant='heading' color='heading'>
          {collection.charAt(0).toUpperCase() + collection.slice(1)}
        </Text>
        <Text variant='body' color='default'>
          {isLoading && <div>Loading...</div>}
          {error && <div>Error: {error.message}</div>}
          {data && (
            <table className={styles.styledTable}>
              <TableHeader collection={collection} />
              <TableData collection={collection} data={data} />
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
