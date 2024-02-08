import { useState } from 'react'

import { Text, Button, Box, Flex } from '@audius/harmony'
import { UseQueryResult } from '@tanstack/react-query'

import { trpc } from 'utils/trpc'

import styles from './Collection.module.css'

type CollectionT = 'uploads' | 'indexed' | 'parsed' | 'published'

const Table = ({
  collection,
  data
}: {
  collection: CollectionT
  data: any
}) => {
  const statusStyle = (deliveryStatus: string) => {
    if (deliveryStatus === 'published') {
      return styles.statusSuccess
    } else if (
      deliveryStatus === 'validating' ||
      deliveryStatus === 'awaiting_publishing'
    ) {
      return styles.statusPending
    } else if (deliveryStatus === 'error' || deliveryStatus === 'rejected') {
      return styles.statusFailed
    }
  }

  switch (collection) {
    case 'uploads':
      return (
        <table className={styles.styledTable}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Path</th>
              <th>E-tag</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item: any) => (
              <tr key={item._id}>
                <td>{item._id}</td>
                <td>{item.path}</td>
                <td>{item.upload_etag}</td>
                <td>{item.created_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )
    case 'indexed':
      return (
        <table className={styles.styledTable}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Upload E-tag</th>
              <th>Delivery ID</th>
              <th>Delivery Status</th>
              <th>XML Filepath</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item: any) => (
              <tr key={item._id}>
                <td>{item._id}</td>
                <td>{item.upload_etag}</td>
                <td>{item.delivery_id}</td>
                <td className={statusStyle(item.delivery_status)}>
                  {item.delivery_status}
                </td>
                <td>{item.xml_file_path}</td>
                <td>{item.created_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )
    case 'parsed':
      return (
        <table className={styles.styledTable}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Upload E-tag</th>
              <th>Delivery ID</th>
              <th>Entity</th>
              <th>Publish Date</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item: any) => (
              <tr key={item._id}>
                <td>{item._id}</td>
                <td>{item.upload_etag}</td>
                <td>{item.delivery_id}</td>
                <td>{item.entity}</td>
                <td>{item.publish_date}</td>
                <td>{item.created_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )
    case 'published':
      return (
        <table className={styles.styledTable}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Upload E-tag</th>
              <th>Delivery ID</th>
              <th>Entity</th>
              <th>Publish Date</th>
              <th>Entity ID</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item: any) => (
              <tr key={item.id}>
                <td>{item._id}</td>
                <td>{item.upload_etag}</td>
                <td>{item.delivery_id}</td>
                <td>{item.entity}</td>
                <td>{item.publish_date}</td>
                <td>{item.entity_id}</td>
                <td>{item.created_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )
  }
}

type CollectionData = {
  items: Record<string, any>
  hasMoreNext: boolean
  hasMorePrev: boolean
}

interface QueryParams {
  nextId?: string
  prevId?: string
}

type QueryFunction = (
  params: QueryParams,
  options: { refetchInterval: number }
) => UseQueryResult<CollectionData, unknown>

const useCollectionQuery = ({
  collection,
  nextId,
  prevId
}: {
  collection: string
  nextId: string | undefined
  prevId: string | undefined
}) => {
  // Determine which collection to query
  let queryFunction: QueryFunction
  switch (collection) {
    case 'uploads':
      queryFunction = trpc.uploads.listCollection.useQuery
      break
    case 'indexed':
      queryFunction = trpc.indexed.listCollection.useQuery
      break
    case 'parsed':
      queryFunction = trpc.parsed.listCollection.useQuery
      break
    case 'published':
      queryFunction = trpc.published.listCollection.useQuery
      break
    default:
      throw new Error('Invalid collection')
  }

  const { data, error, isLoading } = queryFunction(
    { nextId, prevId },
    { refetchInterval: 10000 }
  )

  return { data, error: error as Error | null, isLoading }
}

export const Collection = ({ collection }: { collection: CollectionT }) => {
  const [nextId, setNextId] = useState<string | undefined>(undefined)
  const [prevId, setPrevId] = useState<string | undefined>(undefined)
  const { data, error, isLoading } = useCollectionQuery({
    collection,
    nextId,
    prevId
  })

  const handleNext = () => {
    if (data?.hasMoreNext) {
      setNextId(data.items[data.items.length - 1]._id)
      setPrevId(undefined)
    }
  }

  const handlePrev = () => {
    if (data?.hasMorePrev) {
      setPrevId(data.items[0]._id)
      setNextId(undefined)
    }
  }

  return (
    <Box borderRadius='s' shadow='near' p='xl' backgroundColor='white'>
      <Flex direction='column' gap='l'>
        <Text variant='heading' color='heading'>
          {collection.charAt(0).toUpperCase() + collection.slice(1)}
        </Text>
        {/* TODO resolve "div cannot appear as a descendent of p" error by removing this
          Text div after harmony fixes font styling */}
        <Text variant='body' color='default'>
          {isLoading && <div>Loading...</div>}
          {error && <div>Error: {error.message}</div>}
          {data && <Table collection={collection} data={data} />}

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
