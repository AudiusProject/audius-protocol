import { useState } from 'react'

import { Text, Button, Flex } from '@audius/harmony'
import { UseQueryResult } from '@tanstack/react-query'

import styles from './PaginatedTable.module.css'

export type CollectionData = {
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
  queryFunction,
  nextId,
  prevId
}: {
  queryFunction: QueryFunction
  nextId: string | undefined
  prevId: string | undefined
}) => {
  const { data, error, isLoading } = queryFunction(
    { nextId, prevId },
    { refetchInterval: 10000 }
  )

  return { data, error: error as Error | null, isLoading }
}

export const PaginatedTable = ({
  queryFunction,
  TableDisplay
}: {
  queryFunction: QueryFunction
  TableDisplay: React.ComponentType<{ data: CollectionData }>
}) => {
  const [nextId, setNextId] = useState<string | undefined>(undefined)
  const [prevId, setPrevId] = useState<string | undefined>(undefined)
  const { data, error, isLoading } = useCollectionQuery({
    queryFunction,
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
    <Text variant='body' color='default'>
      {/* TODO resolve "div cannot appear as a descendent of p" error by removing this
          Text div after harmony fixes font styling */}
      {isLoading && <div>Loading...</div>}
      {error && <div>Error: {error.message}</div>}
      {data && (
        <table className={styles.styledTable}>
          <TableDisplay data={data} />
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
  )
}
