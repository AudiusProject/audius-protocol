import { ReactElement } from 'react'

import { StyleProp, ViewStyle, FlatList } from 'react-native'

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
  return (
    <FlatList
      listKey={listKey}
      style={style}
      ListHeaderComponent={listHeader}
      data={null}
      renderItem={() => null}
    />
  )
}
