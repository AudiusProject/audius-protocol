import { ReactElement, useRef } from 'react'

import { StyleProp, ViewStyle, FlatList } from 'react-native'

import { useScrollToTop } from 'app/hooks/useScrollToTop'

type VirtualizedScrollViewProps = {
  children: ReactElement | ReactElement[]
  listKey: string
  style?: StyleProp<ViewStyle>
}
/**
 * ScrollView that can wrap an inner Virtualized List, allowing inner lists to
 * scroll the entire ScrollView
 */
export const VirtualizedScrollView = (props: VirtualizedScrollViewProps) => {
  const { children, listKey, style } = props
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
      listKey={listKey}
      style={style}
      ListHeaderComponent={listHeader}
      data={null}
      renderItem={() => null}
      scrollIndicatorInsets={{ right: Number.MIN_VALUE }}
    />
  )
}
