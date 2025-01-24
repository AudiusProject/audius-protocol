import { useMemo } from 'react'

import { keyBy } from 'lodash'

import {
  useCurrentUserId,
  useCollections,
  useGetSalesAggegrate,
  useTracks,
  usePurchasersCount
} from '~/api'
import { ID } from '~/models'
import { removeNullable } from '~/utils'

export const usePurchasersAudience = ({
  contentId,
  contentType
}: {
  contentId?: ID
  contentType?: 'track' | 'album'
}) => {
  const { data: currentUserId } = useCurrentUserId()
  const { data: salesAggregate } = useGetSalesAggegrate({
    userId: currentUserId!
  })
  const isDisabled = !salesAggregate?.length

  const trackAggregates = salesAggregate?.filter(
    (sale) => sale.contentType === 'track'
  )
  const albumAggregates = salesAggregate?.filter(
    (sale) => sale.contentType === 'album'
  )

  const { data: tracks } = useTracks(
    trackAggregates?.map((sale) => parseInt(sale.contentId))
  )
  const { data: albums } = useCollections(
    albumAggregates?.map((sale) => parseInt(sale.contentId))
  )
  const tracksById = useMemo(() => keyBy(tracks, 'track_id'), [tracks])
  const albumsById = useMemo(() => keyBy(albums, 'playlist_id'), [albums])

  const premiumContentOptions = useMemo(
    () =>
      (salesAggregate ?? [])
        .map((sale) => {
          const content =
            sale.contentType === 'track'
              ? tracksById[sale.contentId]
              : albumsById[sale.contentId]
          if (!content) return null
          return {
            value: { contentId: sale.contentId, contentType: sale.contentType },
            label: 'title' in content ? content?.title : content?.playlist_name
          }
        })
        .filter(removeNullable),
    [salesAggregate, tracksById, albumsById]
  )

  const { data: purchasersCount } = usePurchasersCount({
    contentId,
    contentType
  })

  return {
    isDisabled,
    purchasersCount,
    premiumContentOptions
  }
}
