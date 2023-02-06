import type { ReactElement } from 'react'
import { useRef } from 'react'

import type { FlatListProps } from 'react-native'
import { FlatList } from 'react-native'

import { useScrollToTop } from 'app/hooks/useScrollToTop'

import { PlayBarChin } from './PlayBarChin'

type BaseFlatListProps = Omit<
  FlatListProps<null>,
  'renderItem' | 'data' | 'ListHeaderComponent'
>

type VirtualizedScrollViewProps = BaseFlatListProps & {
  children: ReactElement | ReactElement[]
}
/**
 * ScrollView that can wrap an inner Virtualized List, allowing inner lists to
 * scroll the entire ScrollView
 *
 * This gives us much more flexibility with the layout and styling of FlatLists,
 * for example styling the FlatList content separately from the Header
 */
export const VirtualizedScrollView = (props: VirtualizedScrollViewProps) => {
  const { children, ...other } = props
  const listHeader = Array.isArray(children) ? <>{children}</> : children
  const ref = useRef<FlatList>(null)

  useScrollToTop(() => {
    ref.current?.scrollToOffset({
      offset: 0,
      animated: true
    })
  })

  return (
    <FlatList
      ref={ref}
      ListHeaderComponent={listHeader}
      data={null}
      renderItem={() => null}
      scrollIndicatorInsets={{ right: Number.MIN_VALUE }}
      ListFooterComponent={PlayBarChin}
      {...other}
    />
  )
}
