import type { ComponentType } from 'react'
import { useMemo, useCallback, useRef } from 'react'

import type {
  FlatListProps,
  ListRenderItem,
  ListRenderItemInfo
} from 'react-native'
import { View } from 'react-native'

import { useScrollToTop } from 'app/hooks/useScrollToTop'
import { makeStyles } from 'app/styles'

import type { FlatListT } from './FlatList'
import { FlatList } from './FlatList'

export type CardListProps<ItemT> = FlatListProps<ItemT> & {
  isLoading?: boolean
  LoadingCardComponent?: ComponentType
  disableTopTabScroll?: boolean
  FlatListComponent?: ComponentType<FlatListProps<ItemT | LoadingCard>>
  // If total count is known, use this to aid in rendering the right number
  // of skeletons
  totalCount?: number
}

type LoadingCard = { _loading: true }

const getSkeletonData = (skeletonCount = 6): LoadingCard[] => {
  return Array(Math.min(skeletonCount, 6)).fill({ _loading: true })
}

const DefaultLoadingCard = () => null

const useStyles = makeStyles(({ spacing }) => ({
  card: {
    paddingTop: spacing(3),
    paddingHorizontal: spacing(3) / 2,
    width: '50%'
  },
  bottomCard: {
    paddingBottom: spacing(3)
  },
  leftCard: {
    paddingLeft: spacing(3)
  },
  rightCard: {
    paddingRight: spacing(3)
  }
}))

export function CardList<ItemT extends {}>(props: CardListProps<ItemT>) {
  const {
    renderItem,
    disableTopTabScroll,
    data: dataProp,
    isLoading: isLoadingProp,
    LoadingCardComponent = DefaultLoadingCard,
    FlatListComponent = FlatList,
    totalCount,
    ...other
  } = props

  const styles = useStyles()
  const ref = useRef<FlatListT<ItemT>>(null)
  const isLoading = isLoadingProp ?? !dataProp

  useScrollToTop(() => {
    ref.current?.scrollToOffset({
      offset: 0,
      animated: true
    })
  }, disableTopTabScroll)

  const data = useMemo(() => {
    const skeletonData = isLoading ? getSkeletonData(totalCount) : []
    return [...(dataProp ?? []), ...skeletonData]
  }, [dataProp, isLoading, totalCount])

  const dataLength = data.length

  const handleRenderItem: ListRenderItem<ItemT | LoadingCard> = useCallback(
    (info) => {
      const { index } = info
      const isInLeftColumn = !(index % 2)
      const isLastRow = index + 2 > dataLength

      const style = [
        styles.card,
        isLastRow && styles.bottomCard,
        isInLeftColumn ? styles.leftCard : styles.rightCard
      ]

      const itemElement =
        '_loading' in info.item ? (
          <LoadingCardComponent />
        ) : (
          renderItem?.(info as ListRenderItemInfo<ItemT>) ?? null
        )

      return <View style={style}>{itemElement}</View>
    },
    [renderItem, dataLength, LoadingCardComponent, styles]
  )

  return (
    <FlatListComponent
      ref={ref}
      data={data}
      renderItem={handleRenderItem}
      numColumns={2}
      {...other}
    />
  )
}
