import { forwardRef, MutableRefObject, useContext, useRef } from 'react'

import {
  Animated,
  FlatList as RNFlatList,
  FlatListProps as RNFlatListProps,
  View
} from 'react-native'
import { useCollapsibleScene } from 'react-native-collapsible-tab-view'

import { CollapsibleTabNavigatorContext } from '../top-tab-bar'

import { PullToRefresh, useOverflowHandlers } from './PullToRefresh'

type FlatListProps = RNFlatListProps<any>

type CollapsibleFlatListProps = {
  sceneName: string
} & RNFlatListProps<any>

const CollapsibleFlatList = ({
  sceneName,
  ...other
}: CollapsibleFlatListProps) => {
  const { onRefresh } = other
  const scrollPropsAndRef = useCollapsibleScene(sceneName)
  return (
    <View>
      {onRefresh ? <PullToRefresh /> : null}
      <Animated.FlatList {...other} {...scrollPropsAndRef} />
    </View>
  )
}

const AnimatedFlatList = forwardRef<RNFlatList, FlatListProps>(
  function AnimatedFlatList(
    { refreshing, onRefresh, ...other },
    ref: MutableRefObject<RNFlatList<any> | null>
  ) {
    const scrollRef = useRef<Animated.FlatList>(null)

    const {
      isRefreshing,
      isRefreshDisabled,
      handleRefresh,
      scrollAnim,
      onScroll,
      onScrollBeginDrag,
      onScrollEndDrag
    } = useOverflowHandlers({
      isRefreshing: refreshing,
      scrollResponder: ref?.current || scrollRef.current,
      onRefresh
    })

    return (
      <View>
        {handleRefresh ? (
          <PullToRefresh
            isRefreshing={isRefreshing}
            onRefresh={handleRefresh}
            scrollAnim={scrollAnim}
            isRefreshDisabled={isRefreshDisabled}
          />
        ) : null}
        <Animated.FlatList
          scrollToOverflowEnabled
          ref={ref || scrollRef}
          onScroll={onScroll}
          onScrollBeginDrag={onScrollBeginDrag}
          onScrollEndDrag={onScrollEndDrag}
          {...other}
        />
      </View>
    )
  }
)

/**
 * Provides either a FlatList or an animated FlatList
 * depending on whether or not the list is found in a "collapsible" header tab
 */
export const FlatList = forwardRef<RNFlatList, FlatListProps>(function FlatList(
  props: FlatListProps,
  ref
) {
  const { sceneName } = useContext(CollapsibleTabNavigatorContext)
  if (sceneName) {
    return <CollapsibleFlatList sceneName={sceneName} {...props} />
  }
  return <AnimatedFlatList ref={ref} {...props} />
})
