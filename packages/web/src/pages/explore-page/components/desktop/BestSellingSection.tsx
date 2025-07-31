import React from 'react'

import { useBestSelling } from '@audius/common/api'
import { exploreMessages as messages } from '@audius/common/messages'

import { BestSellingCard } from 'components/best-selling-card'
import { useSearchCategory } from 'pages/search-page/hooks'

import { ExploreSection } from './ExploreSection'

export const BestSellingSection = () => {
  const [category] = useSearchCategory()

  const { data, isLoading } = useBestSelling({
    type:
      category === 'albums' ? 'album' : category === 'tracks' ? 'track' : 'all'
  })
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

    return <BestSellingCard item={item} size='s' loading={isLoading} />
  }

  return (
    <ExploreSection
      title={messages.bestSelling}
      data={ids}
      Card={BestSellingCardWithData}
    />
  )
}
