import type { ComponentType } from 'react'
import { useMemo, useCallback, useRef } from 'react'

import type {
  FlatList as RNFlatList,
  FlatListProps,
  ListRenderItem
} from 'react-native'
import { View } from 'react-native'

import { useScrollToTop } from 'app/hooks/useScrollToTop'
import { makeStyles } from 'app/styles'

import { FlatList } from './FlatList'

export type CardListProps<ItemT> = FlatListProps<ItemT> & {
  isLoading?: boolean
  LoadingCardComponent?: ComponentType
  disableTopTabScroll?: boolean
  FlatListComponent?: ComponentType<FlatListProps<ItemT | LoadingCard>>
}

type LoadingCard = { _loading: true }
const skeletonData: LoadingCard[] = Array(5).fill({ _loading: true })

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

export const CardList = <ItemT,>(props: CardListProps<ItemT>) => {
  const {
    renderItem,
    disableTopTabScroll,
    data: dataProp,
    isLoading: isLoadingProp,
    LoadingCardComponent = DefaultLoadingCard,
    FlatListComponent = FlatList,
    ...other
  } = props

  const styles = useStyles()
  const ref = useRef<RNFlatList>(null)
  const isLoading = isLoadingProp ?? !dataProp

  useScrollToTop(() => {
    ref.current?.scrollToOffset({
      offset: 0,
      animated: true
    })
  }, disableTopTabScroll)

  const data = useMemo(
    () => [...(dataProp ?? []), ...(isLoading ? skeletonData : [])],
    [dataProp, isLoading]
  )

  const dataLength = data?.length ?? 0

  const handleRenderItem: ListRenderItem<ItemT> = useCallback(
    (info) => {
      const { item, index } = info
      const isInLeftColumn = !(index % 2)
      const isLastRow = index + 2 > dataLength

      const style = [
        styles.card,
        isLastRow && styles.bottomCard,
        isInLeftColumn ? styles.leftCard : styles.rightCard
      ]

      const itemElement =
        '_loading' in (item as LoadingCard) ? (
          <LoadingCardComponent />
        ) : (
          renderItem?.(info) ?? null
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
