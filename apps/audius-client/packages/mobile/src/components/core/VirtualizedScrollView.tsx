import { ReactElement, useRef } from 'react'

import { FlatList, FlatListProps } from 'react-native'

import { useScrollToTop } from 'app/hooks/useScrollToTop'

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
      {...other}
    />
  )
}
