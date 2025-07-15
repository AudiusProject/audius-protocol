import React from 'react'

import { BestSellingItemWithId } from '@audius/common/api'

import { BestSellingCard } from 'components/best-selling-card'

import { ExploreSection } from './ExploreSection'

type BestSellingSectionProps = {
  title: string
  data?: BestSellingItemWithId[]
  loading?: boolean
}

export const BestSellingSection: React.FC<BestSellingSectionProps> = ({
  title,
  data,
  loading
}) => {
  // Deduplicate data by ID to avoid duplicate keys
  const uniqueData = data?.filter(
    (item, index, self) => self.findIndex((t) => t.id === item.id) === index
  )

  // Transform BestSellingItem data to just IDs for ExploreSection
  const ids = uniqueData?.map((item) => item.id)

  // Create a Card component that knows how to handle BestSelling data
  const BestSellingCardWithData = ({ id }: { id: number }) => {
    const item = uniqueData?.find((item) => item.id === id)
    if (!item) return null

    return <BestSellingCard item={item} size='s' loading={loading} />
  }

  return (
    <ExploreSection
      title={title}
      data={ids}
      Card={BestSellingCardWithData}
      key={`best-selling-${title}`}
    />
  )
}
