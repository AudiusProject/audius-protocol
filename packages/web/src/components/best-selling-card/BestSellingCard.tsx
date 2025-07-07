import React from 'react'

import { BestSellingItemWithId } from '@audius/common/api'
import { BestSellingItemContentTypeEnum } from '@audius/sdk'

import { CollectionCard } from 'components/collection/CollectionCard'
import { TrackCard } from 'components/track/TrackCard'

type BestSellingCardProps = {
  item: BestSellingItemWithId
  size?: 'xs' | 's' | 'm' | 'l'
  loading?: boolean
  noNavigation?: boolean
  onClick?: React.MouseEventHandler<HTMLDivElement>
}

export const BestSellingCard: React.FC<BestSellingCardProps> = ({
  item,
  size = 'm',
  loading,
  noNavigation,
  onClick
}) => {
  const isTrack = item.contentType === BestSellingItemContentTypeEnum.Track

  if (isTrack) {
    return (
      <TrackCard
        id={item.id}
        size={size}
        loading={loading}
        noNavigation={noNavigation}
        onClick={onClick}
      />
    )
  }

  return (
    <CollectionCard
      id={item.id}
      size={size}
      loading={loading}
      noNavigation={noNavigation}
      onClick={onClick}
    />
  )
}