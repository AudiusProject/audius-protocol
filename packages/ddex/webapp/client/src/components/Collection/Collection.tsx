import { useState } from 'react'

import { Text, Button, Box, Flex } from '@audius/harmony'
import { UseQueryResult } from '@tanstack/react-query'

import { useEnvVars } from 'providers/EnvVarsProvider'
import { trpc } from 'utils/trpc'

import styles from './Collection.module.css'

type CollectionT = 'deliveries' | 'pending_releases' | 'published_releases'

const Table = ({
  collection,
  data
}: {
  collection: CollectionT
  data: any
}) => {
  const { ddexChoreography } = useEnvVars()

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

  const DeliveryRow = ({ item }: { item: any }) => {
    return (
      <tr key={item._id} className={styles.delivery}>
        <td>{item._id}</td>
        <td>{item.zip_file_path}</td>
        <td className={statusStyle(item.delivery_status)}>
          {item.delivery_status}
        </td>
        <td>{item.created_at}</td>
        <td>
          {item.validation_errors && item.validation_errors.length
            ? item.validation_errors.join(', ')
            : 'None'}
        </td>
        {/* Placeholder cells for alignment, only if needed */}
        {ddexChoreography === 'ERNBatched' && (
          <>
            <td></td>
            <td></td>
            <td></td>
          </>
        )}
        <td></td>
        <td></td>
        <td></td>
      </tr>
    )
  }

  const BatchRow = ({ batch }: { batch: any }) => {
    return (
      <>
        <tr key={batch.batch_id} className={styles.batch}>
          {/* Placeholder cells for alignment */}
          <td colSpan={5}></td>
          <td>{batch.batch_id}</td>
          <td>{batch.batch_xml_path}</td>
          <td>
            {batch.validation_errors && batch.validation_errors.length
              ? batch.validation_errors.join(', ')
              : 'None'}
          </td>
        </tr>
        {batch.releases.map((release: any) => (
          <ReleaseRow key={release.release_id} release={release} />
        ))}
      </>
    )
  }

  const ReleaseRow = ({ release }: { release: any }) => {
    return (
      <tr key={release.release_id} className={styles.release}>
        {/* Placeholder cells for alignment */}
        <td colSpan={8}></td>
        <td>{release.release_id}</td>
        <td>{release.xml_file_path}</td>
        <td>
          {release.validation_errors && release.validation_errors.length
            ? release.validation_errors.join(', ')
            : 'None'}
        </td>
      </tr>
    )
  }

  switch (collection) {
    case 'deliveries':
      return (
        <table className={styles.styledTable}>
          <thead>
            <tr>
              <th colSpan={5}>Delivery</th>
              {ddexChoreography === 'ERNBatched' && <th colSpan={3}>Batch</th>}
              <th colSpan={3}>Release</th>
            </tr>
            <tr>
              {' '}
              {/* Column Headers Below */}
              <th>Delivery ID</th>
              <th>ZIP File</th>
              <th>Status</th>
              <th>Created At</th>
              <th>Errors</th>
              {/* Batch Headers if applicable */}
              {ddexChoreography === 'ERNBatched' && (
                <>
                  <th>Batch ID</th>
                  <th>Batch XML Filepath</th>
                  <th>Batch Errors</th>
                </>
              )}
              {/* Release Headers */}
              <th>Release ID</th>
              <th>Release XML Filepath</th>
              <th>Release Errors</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item: any) => (
              <>
                <DeliveryRow item={item} />
                {item.batches &&
                  ddexChoreography === 'ERNBatched' &&
                  item.batches.map((batch: any) => (
                    <BatchRow key={batch.batch_id} batch={batch} />
                  ))}
                {item.releases &&
                  ddexChoreography === 'ERNReleaseByRelease' &&
                  item.releases.map((release: any) => (
                    <ReleaseRow key={release.release_id} release={release} />
                  ))}
              </>
            ))}
          </tbody>
        </table>
      )
    case 'pending_releases':
      return (
        <table className={styles.styledTable}>
          <thead>
            <tr>
              <th>Release ID</th>
              <th>Entity</th>
              <th>Publish Date</th>
              <th>Created At</th>
              <th>Publish Errors</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item: any) => (
              <tr key={item._id}>
                <td>{item._id}</td>
                <td>
                  {item.create_album_release?.ddex_release_ref
                    ? 'album'
                    : item.create_track_release?.ddex_release_ref
                      ? 'track'
                      : 'unknown'}
                </td>
                <td>{item.publish_date}</td>
                <td>{item.created_at}</td>
                <td className={item.failure_count ? styles.statusFailed : ''}>
                  {item.failure_count
                    ? (item.failed_after_upload ? '(after uploading) ' : '') +
                      item.failure_count +
                      ': ' +
                      (item.publish_errors || ['unknown']).join(', ')
                    : 'None'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )
    case 'published_releases':
      return (
        <table className={styles.styledTable}>
          <thead>
            <tr>
              <th>Release ID</th>
              <th>Entity</th>
              <th>Entity ID</th>
              <th>Blockhash</th>
              <th>Blocknumber</th>
              <th>Publish Date</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item: any) => (
              <tr key={item.id}>
                <td>{item._id}</td>
                <td>
                  {item.track ? 'track' : item.album ? 'album' : 'unknown'}
                </td>
                <td>{item.entity_id}</td>
                <td>{item.blockhash}</td>
                <td>{item.blocknumber}</td>
                <td>{item.publish_date}</td>
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
    case 'deliveries':
      queryFunction = trpc.deliveries.listCollection.useQuery
      break
    case 'pending_releases':
      queryFunction = trpc.pendingReleases.listCollection.useQuery
      break
    case 'published_releases':
      queryFunction = trpc.publishedReleases.listCollection.useQuery
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
          {collection
            .split('_')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')}
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
